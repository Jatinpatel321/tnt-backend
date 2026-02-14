import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field

import httpx
from fastapi import Request

logger = logging.getLogger("tnt.observability")


@dataclass
class RouteMetric:
    requests: int = 0
    server_errors: int = 0
    total_latency_ms: float = 0.0


@dataclass
class MetricsState:
    total_requests: int = 0
    server_errors: int = 0
    started_at: float = field(default_factory=time.time)
    per_route: dict[str, RouteMetric] = field(default_factory=lambda: defaultdict(RouteMetric))
    last_alert_at: float = 0.0


class Observability:
    def __init__(self):
        self.state = MetricsState()

    async def track_request(self, request: Request, call_next):
        route_key = f"{request.method} {request.url.path}"
        started = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            self.state.total_requests += 1

            route_metric = self.state.per_route[route_key]
            route_metric.requests += 1
            route_metric.total_latency_ms += elapsed_ms

            if status_code >= 500:
                self.state.server_errors += 1
                route_metric.server_errors += 1

    def error_rate_percent(self) -> float:
        if self.state.total_requests == 0:
            return 0.0
        return (self.state.server_errors / self.state.total_requests) * 100.0

    def maybe_alert_error_budget(
        self,
        threshold_percent: float,
        min_requests: int,
        alert_webhook_url: str | None = None,
    ) -> None:
        if self.state.total_requests < min_requests:
            return

        current_rate = self.error_rate_percent()
        now = time.time()
        if current_rate > threshold_percent and now - self.state.last_alert_at >= 60:
            message = (
                "Error budget breached: "
                f"error_rate={current_rate:.2f}% threshold={threshold_percent:.2f}% "
                f"requests={self.state.total_requests} server_errors={self.state.server_errors}"
            )
            logger.error(message)

            if alert_webhook_url:
                try:
                    httpx.post(
                        alert_webhook_url,
                        json={
                            "event": "error_budget_breach",
                            "error_rate_percent": current_rate,
                            "threshold_percent": threshold_percent,
                            "total_requests": self.state.total_requests,
                            "server_errors": self.state.server_errors,
                        },
                        timeout=2.0,
                    )
                except Exception:
                    logger.exception("Failed to deliver error budget alert webhook")

            self.state.last_alert_at = now

    def snapshot(self) -> dict:
        routes = {}
        for route, metric in self.state.per_route.items():
            avg_latency = metric.total_latency_ms / metric.requests if metric.requests else 0.0
            routes[route] = {
                "requests": metric.requests,
                "server_errors": metric.server_errors,
                "avg_latency_ms": round(avg_latency, 2),
            }

        uptime_seconds = int(time.time() - self.state.started_at)
        return {
            "uptime_seconds": uptime_seconds,
            "total_requests": self.state.total_requests,
            "server_errors": self.state.server_errors,
            "error_rate_percent": round(self.error_rate_percent(), 4),
            "routes": routes,
        }


observability = Observability()
