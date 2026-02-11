import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vendorsService, MenuItem as MenuItemType } from '../../../services/vendors';
import { useCartStore, CartItem } from '../../../store/cartStore';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const router = useRouter();
  const { vendorId, vendorName: paramVendorName } = useLocalSearchParams();
  const { items, addItem, removeItem, getItemCount, setVendor } = useCartStore();

  useEffect(() => {
    if (vendorId && paramVendorName) {
      setVendorName(paramVendorName as string);
      setVendor(vendorId as string, paramVendorName as string);
      fetchMenu();
    }
  }, [vendorId, paramVendorName]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await vendorsService.getVendorMenu(vendorId as string);
      setMenuItems(data);
    } catch (error: any) {
      console.error('Failed to fetch menu:', error);
      Alert.alert('Error', 'Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getItemQuantity = (itemId: string) => {
    const cartItem = items.find(item => item.id === `${vendorId}-${itemId}`);
    return cartItem?.quantity || 0;
  };

  const handleAddItem = (menuItem: MenuItemType) => {
    const cartItem: Omit<CartItem, 'quantity'> = {
      id: `${vendorId}-${menuItem.id}`,
      name: menuItem.name,
      price: menuItem.price,
      imageUrl: menuItem.image_url,
      isVeg: menuItem.is_veg
    };
    addItem(cartItem);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(`${vendorId}-${itemId}`);
  };

  const handleViewCart = () => {
    router.push('/(tabs)/food/cart');
  };

  const renderMenuItem = (item: MenuItemType) => {
    const quantity = getItemQuantity(item.id);

    return (
      <View key={item.id} style={styles.menuItem}>
        <View style={styles.itemImageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="restaurant-outline" size={32} color="#666" />
            </View>
          )}
          <View style={[styles.vegIndicator, item.is_veg ? styles.vegBadge : styles.nonVegBadge]}>
            <Ionicons
              name={item.is_veg ? "leaf" : "fish"}
              size={12}
              color={item.is_veg ? "#28a745" : "#dc3545"}
            />
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </View>

        <View style={styles.quantityControls}>
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddItem(item)}
              disabled={!item.is_available}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="remove" size={16} color="#007bff" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleAddItem(item)}
              >
                <Ionicons name="add" size={16} color="#007bff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonPrice} />
          </View>
          <View style={styles.skeletonButton} />
        </View>
      ))}
    </View>
  );

  const itemCount = getItemCount();

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{vendorName}</Text>
          <Text style={styles.headerSubtitle}>Menu</Text>
        </View>
        {itemCount > 0 && (
          <TouchableOpacity onPress={handleViewCart} style={styles.cartButton}>
            <Ionicons name="basket" size={24} color="#007bff" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        renderSkeletonLoader()
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {menuItems.map(renderMenuItem)}
        </ScrollView>
      )}

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <TouchableOpacity style={styles.floatingCartButton} onPress={handleViewCart}>
          <Ionicons name="basket" size={20} color="#fff" />
          <Text style={styles.floatingCartText}>View Cart ({itemCount})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#007bff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadge: {
    backgroundColor: '#e8f5e8',
  },
  nonVegBadge: {
    backgroundColor: '#ffeaea',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007bff',
  },
  quantityControls: {
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 16,
  },
  skeletonDetails: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '40%',
  },
  skeletonButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
});
