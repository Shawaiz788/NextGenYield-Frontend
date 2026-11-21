import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useMarketplaceItemsQuery,
  useCreateMarketplaceItemMutation,
  useToggleItemSoldMutation,
  useDeleteMarketplaceItemMutation,
  useMyMarketplaceItemsQuery,
} from '@/hooks/use-marketplace';
import { useStartConversationMutation } from '@/hooks/use-community';
import { MarketplaceItemDTO } from '@/services/api-client';

const MARKET_CATEGORIES = [
  { key: 'all', labelEn: 'All', labelUr: 'سب', icon: 'apps' },
  { key: 'seeds', labelEn: 'Seeds', labelUr: 'بیج', icon: 'seed' },
  { key: 'fertilizer', labelEn: 'Fertilizer', labelUr: 'کھاد', icon: 'flask-outline' },
  { key: 'machinery', labelEn: 'Machinery', labelUr: 'مشینری', icon: 'tractor' },
  { key: 'wheat_grain', labelEn: 'Wheat Grain', labelUr: 'گندم دانہ', icon: 'grain' },
  { key: 'pesticides', labelEn: 'Pesticides', labelUr: 'ادویات', icon: 'shield-bug-outline' },
  { key: 'land_lease', labelEn: 'Land Lease', labelUr: 'کھیت ٹھیکہ', icon: 'map-outline' },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const { language, t } = useApp();
  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<'browse' | 'mine'>('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item modal details
  const [selectedItem, setSelectedItem] = useState<MarketplaceItemDTO | null>(null);

  // Sell Item Modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('seeds');
  const [newPrice, setNewPrice] = useState('');
  const [newCondition, setNewCondition] = useState('new');
  const [newDistrict, setNewDistrict] = useState('Faisalabad');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('03001234567');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [sellStatus, setSellStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // TanStack Queries & Mutations
  const itemsQuery = useMarketplaceItemsQuery({
    category: selectedCategory,
    search: searchQuery,
  });
  const myItemsQuery = useMyMarketplaceItemsQuery();
  const createItemMutation = useCreateMarketplaceItemMutation();
  const toggleSoldMutation = useToggleItemSoldMutation();
  const deleteItemMutation = useDeleteMarketplaceItemMutation();
  const startConversationMutation = useStartConversationMutation();

  const handlePostItem = async () => {
    if (!newTitle.trim()) {
      Alert.alert(isUrdu ? 'نام درکار ہے' : 'Title Required', isUrdu ? 'چیز کا نام درج کریں۔' : 'Please enter item title.');
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum <= 0) {
      Alert.alert(isUrdu ? 'قیمت درکار ہے' : 'Price Required', isUrdu ? 'درست قیمت (روپوں میں) درج کریں۔' : 'Please enter a valid price in PKR.');
      return;
    }
    const cleanPhone = newPhone.replace(/[\s\-]/g, '');
    const pakPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!pakPhoneRegex.test(cleanPhone)) {
      Alert.alert(isUrdu ? 'غلط فون نمبر' : 'Invalid Phone', isUrdu ? 'درست پاکستانی موبائل نمبر درج کریں (03XXXXXXXXX)' : 'Enter valid Pakistani phone (03XXXXXXXXX)');
      return;
    }
    if (!newDesc.trim()) {
      Alert.alert(isUrdu ? 'تفصیل درکار ہے' : 'Description Required', isUrdu ? 'چیز کی تفصیل درج کریں۔' : 'Please enter description.');
      return;
    }

    setSellStatus('sending');
    try {
      await createItemMutation.mutateAsync({
        title: newTitle.trim(),
        category: newCategory,
        price_pkr: priceNum,
        condition: newCondition,
        district: newDistrict.trim() || 'Faisalabad',
        location_address: newAddress.trim() || undefined,
        contact_phone: cleanPhone,
        description: newDesc.trim(),
        image_url: newImageUrl.trim() || undefined,
      });
      setSellStatus('success');
      setTimeout(() => {
        setSellStatus('idle');
        setIsSellModalOpen(false);
        setNewTitle('');
        setNewPrice('');
        setNewDesc('');
        setNewImageUrl('');
        Alert.alert(
          isUrdu ? 'کامیابی' : 'Item Listed!',
          isUrdu ? 'آپ کی چیز مارکیٹ پلیس پر کامیابی سے شائع ہو چکی ہے۔' : 'Your item is now live on NextGenYield Agri-Marketplace.'
        );
      }, 800);
    } catch (err: any) {
      setSellStatus('idle');
      Alert.alert(isUrdu ? 'خرابی' : 'Error', err?.message || 'Failed to list item.');
    }
  };

  const handleCallSeller = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleChatWithSeller = async (item: MarketplaceItemDTO) => {
    try {
      await startConversationMutation.mutateAsync({
        recipientId: item.seller_id,
        content: `Salam! I am interested in your listing: "${item.title}" (PKR ${item.price_pkr.toLocaleString()}). Is it still available?`,
      });
      setSelectedItem(null);
      // Switch tab to community
      router.push('/(tabs)/community' as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to start chat with seller.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isUrdu ? 'زرعی مارکیٹ پلیس' : 'Agri Marketplace'}</Text>
          <Text style={styles.headerSubtitle}>
            {isUrdu ? 'بیج، کھاد، گندم اور زرعی آلات کی خرید و فروخت' : 'Buy & sell wheat seeds, fertilizers, produce & machinery'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sellItemBtn}
          onPress={() => setIsSellModalOpen(true)}>
          <Ionicons name="pricetag" size={16} color="#FFFFFF" />
          <Text style={styles.sellItemBtnText}>{isUrdu ? 'فروخت کریں' : '+ Sell'}</Text>
        </TouchableOpacity>
      </View>

      {/* Facebook-style Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={isUrdu ? 'بیج، ڈی اے پی کھاد، ٹریکٹر تلاش کریں...' : 'Search seeds, DAP, machinery, grain...'}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Segmented: Browse vs My Listings */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'browse' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('browse')}>
          <Text style={[styles.toggleBtnText, activeTab === 'browse' && styles.toggleBtnTextActive]}>
            {isUrdu ? 'مارکیٹ براؤز کریں' : 'Browse Marketplace'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'mine' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('mine')}>
          <Text style={[styles.toggleBtnText, activeTab === 'mine' && styles.toggleBtnTextActive]}>
            {isUrdu ? 'میری لسٹنگز' : 'My Listings'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'browse' ? (
        <View style={{ flex: 1 }}>
          {/* Categories Horizontal Scrolling Pills */}
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {MARKET_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat.key)}>
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                    />
                    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                      {isUrdu ? cat.labelUr : cat.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Product Cards 2-Column Grid */}
          <ScrollView style={styles.feedScroll} contentContainerStyle={styles.gridContainer}>
            {itemsQuery.isLoading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingText}>{isUrdu ? 'اشیاء لوڈ ہو رہی ہیں...' : 'Loading marketplace items...'}</Text>
              </View>
            ) : itemsQuery.data?.length === 0 ? (
              <View style={styles.emptyFeedBox}>
                <MaterialCommunityIcons name="store-outline" size={54} color="#94A3B8" />
                <Text style={styles.emptyFeedText}>
                  {isUrdu ? 'اس زمرے میں کوئی چیز موجود نہیں۔ فروخت کے لیے پہلی چیز آپ لسٹ کریں!' : 'No items found matching criteria. List your product for sale!'}
                </Text>
              </View>
            ) : (
              <View style={styles.gridRow}>
                {itemsQuery.data?.map((item) => (
                  <TouchableOpacity
                    key={item.item_id}
                    style={styles.productCard}
                    activeOpacity={0.8}
                    onPress={() => setSelectedItem(item)}>
                    {/* Item Image */}
                    <View style={styles.imageContainer}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <MaterialCommunityIcons name="shopping" size={36} color="#CBD5E1" />
                        </View>
                      )}
                      <View style={styles.conditionTag}>
                        <Text style={styles.conditionTagText}>{item.condition.toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productPrice}>PKR {item.price_pkr.toLocaleString()}</Text>
                      <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color="#64748B" />
                        <Text style={styles.productLocation} numberOfLines={1}>{item.district}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* MY LISTINGS VIEW */
        <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
          {myItemsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#16A34A" />
          ) : myItemsQuery.data?.length === 0 ? (
            <View style={styles.emptyFeedBox}>
              <MaterialCommunityIcons name="tag-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyFeedText}>
                {isUrdu ? 'آپ نے ابھی تک کوئی چیز فروخت کے لیے نہیں لگائی۔' : 'You have not listed any items yet.'}
              </Text>
            </View>
          ) : (
            myItemsQuery.data?.map((item) => (
              <View key={item.item_id} style={styles.myListingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.myListingTitle}>{item.title}</Text>
                  <Text style={styles.myListingPrice}>PKR {item.price_pkr.toLocaleString()}</Text>
                  <Text style={styles.myListingStatus}>
                    {item.is_sold ? (isUrdu ? 'فروخت شدہ' : '🔴 Sold') : (isUrdu ? 'دستیاب ہے' : '🟢 Active Available')}
                  </Text>
                </View>

                <View style={{ gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.toggleSoldBtn, item.is_sold && { backgroundColor: '#F1F5F9' }]}
                    onPress={() => toggleSoldMutation.mutate(item.item_id)}>
                    <Text style={[styles.toggleSoldBtnText, item.is_sold && { color: '#475569' }]}>
                      {item.is_sold ? (isUrdu ? 'دستیاب کریں' : 'Mark Available') : (isUrdu ? 'فروخت شدہ مارک کریں' : 'Mark Sold')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteListingBtn}
                    onPress={() => {
                      Alert.alert(
                        isUrdu ? 'حذف کریں' : 'Delete Listing',
                        isUrdu ? 'کیا آپ اس چیز کو لسٹنگ سے ختم کرنا چاہتے ہیں؟' : 'Remove this item permanently?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteItemMutation.mutate(item.item_id) },
                        ]
                      );
                    }}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Item Details Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent={false} onRequestClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <SafeAreaView style={styles.modalFullContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.backBtn}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>{isUrdu ? 'تفصیلات' : 'Listing Details'}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.feedScroll} contentContainerStyle={styles.detailContent}>
              {selectedItem.image_url ? (
                <Image source={{ uri: selectedItem.image_url }} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <View style={[styles.detailImage, styles.imagePlaceholder]}>
                  <MaterialCommunityIcons name="shopping" size={60} color="#94A3B8" />
                </View>
              )}

              <View style={styles.detailMainBox}>
                <Text style={styles.detailPrice}>PKR {selectedItem.price_pkr.toLocaleString()}</Text>
                <Text style={styles.detailTitle}>{selectedItem.title}</Text>

                <View style={styles.detailMetaRow}>
                  <View style={styles.conditionTag}>
                    <Text style={styles.conditionTagText}>{selectedItem.condition.toUpperCase()}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{selectedItem.category.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.detailLocation}>📍 {selectedItem.district}</Text>
                </View>

                {selectedItem.location_address ? (
                  <Text style={styles.detailAddress}>📌 {selectedItem.location_address}</Text>
                ) : null}

                <Text style={styles.detailSectionTitle}>{isUrdu ? 'تفصیل:' : 'Description:'}</Text>
                <Text style={styles.detailDesc}>{selectedItem.description}</Text>

                {/* Seller Card */}
                <View style={styles.sellerCard}>
                  <View style={styles.sellerAvatar}>
                    <Text style={styles.avatarInitials}>{selectedItem.seller_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.sellerName}>{selectedItem.seller_name}</Text>
                    <Text style={styles.sellerDistrict}>{selectedItem.district} · Verified Farmer</Text>
                  </View>
                </View>

                {/* Contact & Chat Buttons */}
                <View style={styles.contactButtonsRow}>
                  <TouchableOpacity
                    style={styles.chatSellerBtn}
                    onPress={() => handleChatWithSeller(selectedItem)}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                    <Text style={styles.chatSellerBtnText}>{isUrdu ? 'چیٹ میں بات کریں' : 'Chat with Seller'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.callSellerBtn}
                    onPress={() => handleCallSeller(selectedItem.seller_phone)}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.callSellerBtnText}>{isUrdu ? 'فون کال' : 'Call'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Post / Sell Item Modal */}
      <Modal visible={isSellModalOpen} animationType="slide" transparent={false} onRequestClose={() => setIsSellModalOpen(false)}>
        <SafeAreaView style={styles.modalFullContainer}>
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => setIsSellModalOpen(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isUrdu ? 'مارکیٹ میں چیز لسٹ کریں' : 'Sell Agricultural Product'}</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
            <Text style={styles.inputLabel}>{isUrdu ? 'پروڈکٹ کا نام *' : 'Item Title *'}</Text>
            <TextInput
              style={styles.formInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Certified Akbar-2019 Wheat Seed (50kg)"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'زمرہ (Category)' : 'Category'}</Text>
            <View style={styles.typeSelectorRow}>
              {MARKET_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.typeOptionPill, newCategory === cat.key && styles.typeOptionPillActive]}
                  onPress={() => setNewCategory(cat.key)}>
                  <Text style={[styles.typeOptionText, newCategory === cat.key && styles.typeOptionTextActive]}>
                    {isUrdu ? cat.labelUr : cat.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{isUrdu ? 'قیمت (PKR) *' : 'Price (PKR) *'}</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder="4800"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{isUrdu ? 'حالت' : 'Condition'}</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCondition}
                  onChangeText={setNewCondition}
                  placeholder="New / Used"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{isUrdu ? 'ضلع / علاقہ *' : 'District *'}</Text>
                <TextInput
                  style={styles.formInput}
                  value={newDistrict}
                  onChangeText={setNewDistrict}
                  placeholder="Faisalabad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{isUrdu ? 'فون نمبر *' : 'Phone Number *'}</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="03001234567"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>{isUrdu ? 'مقام / دکان کا پتہ (اختیاری)' : 'Location / Shop Address (Optional)'}</Text>
            <TextInput
              style={styles.formInput}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Grain Market, Jhang Road"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'تفصیل *' : 'Description *'}</Text>
            <TextInput
              style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Provide quality, certification details, bags available..."
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'تصویر کا لنک (اختیاری)' : 'Product Photo URL (Optional)'}</Text>
            <TextInput
              style={styles.formInput}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder="https://images.unsplash.com/..."
            />

            <TouchableOpacity
              style={[styles.submitPostBtn, sellStatus === 'sending' && { opacity: 0.7 }]}
              disabled={sellStatus === 'sending'}
              onPress={handlePostItem}>
              {sellStatus === 'sending' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitPostBtnText}>
                    {isUrdu ? 'مارکیٹ میں شائع کریں' : 'Publish Product to Marketplace'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  sellItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sellItemBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: FontFamily.regular,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#16A34A',
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },
  feedScroll: {
    flex: 1,
  },
  gridContainer: {
    padding: 12,
    paddingBottom: 40,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#0F172ACC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  conditionTagText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 10,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  productTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  productLocation: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    flex: 1,
  },
  feedContent: {
    padding: 16,
    paddingBottom: 40,
  },
  myListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  myListingTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  myListingPrice: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
    marginTop: 2,
  },
  myListingStatus: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 3,
  },
  toggleSoldBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  toggleSoldBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  deleteListingBtn: {
    alignSelf: 'flex-end',
    padding: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  detailContent: {
    paddingBottom: 40,
  },
  detailImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  detailMainBox: {
    padding: 16,
  },
  detailPrice: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  detailTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 4,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  detailLocation: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  detailAddress: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#475569',
    marginTop: 8,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: '#334155',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16A34A20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  sellerName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  sellerDistrict: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  chatSellerBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  chatSellerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  callSellerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  callSellerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  typeOptionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeOptionText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  submitPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },
  submitPostBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  emptyFeedBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyFeedText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
  },
});
