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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, Spacing, Radius, CardStyle, PrimaryButtonShadow, MetricNumberStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useMarketplaceItemsQuery,
  useCreateMarketplaceItemMutation,
  useToggleItemSoldMutation,
  useDeleteMarketplaceItemMutation,
  useMyMarketplaceItemsQuery,
} from '@/hooks/use-marketplace';
import { useStartConversationMutation } from '@/hooks/use-community';
import { MarketplaceItemDTO, PublicUserProfileDTO } from '@/services/api-client';
import { UserProfileModal } from '@/components/user-profile-modal';

const MARKET_CATEGORIES = [
  { key: 'all', labelEn: 'All', labelUr: 'سب', icon: 'apps' },
  { key: 'seeds', labelEn: 'Seeds', labelUr: 'بیج', icon: 'seed' },
  { key: 'fertilizer', labelEn: 'Fertilizer', labelUr: 'کھاد', icon: 'flask-outline' },
  { key: 'machinery', labelEn: 'Machinery', labelUr: 'مشینری', icon: 'tractor' },
  { key: 'wheat_grain', labelEn: 'Wheat Grain', labelUr: 'گندم دانہ', icon: 'grain' },
  { key: 'pesticides', labelEn: 'Pesticides', labelUr: 'ادویات', icon: 'shield-bug-outline' },
  { key: 'land_lease', labelEn: 'Land Lease', labelUr: 'کھیت ٹھیکہ', icon: 'map-outline' },
];

const QUICK_SEARCH_CHIPS = [
  { labelEn: 'Akbar-2019', labelUr: 'اکبر 2019', query: 'Akbar-2019' },
  { labelEn: 'DAP', labelUr: 'ڈی اے پی', query: 'DAP' },
  { labelEn: 'Seed Drill', labelUr: 'سیڈ ڈرل', query: 'Drill' },
  { labelEn: 'Faisalabad', labelUr: 'فیصل آباد', query: 'Faisalabad' },
  { labelEn: 'Wheat Grain', labelUr: 'گندم دانہ', query: 'Wheat' },
];

const CONDITION_CHIPS = [
  { key: 'new', labelEn: 'Brand New', labelUr: 'بالکل نیا' },
  { key: 'like_new', labelEn: 'Used · Good', labelUr: 'استعمال شدہ · عمدہ' },
  { key: 'used', labelEn: 'Used', labelUr: 'پرانا' },
];

const MARKET_DISTRICTS = ['Faisalabad', 'Lahore', 'Multan', 'Sahiwal', 'Sargodha'];

export default function MarketplaceScreen() {
  const router = useRouter();
  const { language, t } = useApp();
  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<'browse' | 'mine'>('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Akbar-2019', 'DAP']);

  const applyQuickSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (searchQuery.toLowerCase() === trimmed.toLowerCase()) {
      setSearchQuery('');
      return;
    }
    setSearchQuery(trimmed);
    setRecentSearches((prev) => [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 4));
  };

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

  const [isStartingChat, setIsStartingChat] = useState(false);

  // Seller Profile Modal state
  const [selectedSellerUserId, setSelectedSellerUserId] = useState<string | null>(null);
  const [selectedSellerInitialData, setSelectedSellerInitialData] = useState<Partial<PublicUserProfileDTO> | undefined>(undefined);

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
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      const conv = await startConversationMutation.mutateAsync({
        recipientId: item.seller_id,
        content: `Salam! I am interested in your listing: "${item.title}" (PKR ${item.price_pkr.toLocaleString()}). Is it still available?`,
      });
      setSelectedItem(null);
      // Directly open the conversation in community messages
      router.push({
        pathname: '/(tabs)/community',
        params: {
          conversationId: conv.conversation_id,
          recipientName: item.seller_name,
          subTab: 'messages',
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to start chat with seller.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleStartChatFromProfile = async (sellerId: string, sellerName: string) => {
    try {
      const conv = await startConversationMutation.mutateAsync({
        recipientId: sellerId,
        content: 'Salam! I saw your profile on NextGenYield and would like to connect.',
      });
      setSelectedSellerUserId(null);
      setSelectedItem(null);
      router.push({
        pathname: '/(tabs)/community',
        params: {
          conversationId: conv.conversation_id,
          recipientName: sellerName,
          subTab: 'messages',
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to start chat with farmer.');
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
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.85}
          onPress={() => setIsSellModalOpen(true)}>
          <Ionicons name="pricetag" size={16} color="#FFFFFF" />
          <Text style={styles.sellItemBtnText}>{isUrdu ? 'فروخت کریں' : '+ Sell'}</Text>
        </TouchableOpacity>
      </View>

      {/* Smarter Search Bar + Trending & Recent Chips */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                const term = searchQuery.trim();
                setRecentSearches((prev) => [term, ...prev.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 4));
              }
            }}
            returnKeyType="search"
            placeholder={isUrdu ? 'بیج، ڈی اے پی کھاد، ٹریکٹر تلاش کریں...' : 'Search seeds, DAP, machinery, grain...'}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {activeTab === 'browse' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSearchScroll}>
            {recentSearches.map((recent) => {
              const active = searchQuery.toLowerCase() === recent.toLowerCase();
              return (
                <TouchableOpacity
                  key={`rec-${recent}`}
                  style={[styles.quickSearchChip, active && styles.quickSearchChipActive]}
                  activeOpacity={0.75}
                  onPress={() => applyQuickSearch(recent)}>
                  <Ionicons name="time-outline" size={12} color={active ? '#15803D' : '#64748B'} />
                  <Text style={[styles.quickSearchChipText, active && styles.quickSearchChipTextActive]}>
                    {recent}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {QUICK_SEARCH_CHIPS.filter(
              (chip) => !recentSearches.some((r) => r.toLowerCase() === chip.query.toLowerCase())
            ).map((chip) => {
              const active = searchQuery.toLowerCase() === chip.query.toLowerCase();
              return (
                <TouchableOpacity
                  key={chip.query}
                  style={[styles.quickSearchChip, active && styles.quickSearchChipActive]}
                  activeOpacity={0.75}
                  onPress={() => applyQuickSearch(chip.query)}>
                  <Ionicons name="trending-up" size={12} color={active ? '#15803D' : '#16A34A'} />
                  <Text style={[styles.quickSearchChipText, active && styles.quickSearchChipTextActive]}>
                    {isUrdu ? chip.labelUr : chip.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
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
                <View style={styles.emptyIconBadge}>
                  <MaterialCommunityIcons name="storefront-outline" size={32} color="#16A34A" />
                </View>
                <Text style={styles.emptyFeedTitle}>
                  {isUrdu ? 'کوئی لسٹنگ نہیں ملی' : 'No Matching Listings Yet'}
                </Text>
                <Text style={styles.emptyFeedText}>
                  {isUrdu ? 'اس زمرے میں کوئی چیز موجود نہیں۔ فروخت کے لیے پہلی چیز آپ لسٹ کریں!' : 'Be the first grower in your district to list certified seeds, inputs, or grain here.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionCta}
                  activeOpacity={0.85}
                  onPress={() => setIsSellModalOpen(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionCtaText}>
                    {isUrdu ? '+ پہلی چیز لسٹ کریں' : '+ List an Item for Sale'}
                  </Text>
                </TouchableOpacity>
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
              <View style={styles.emptyIconBadge}>
                <MaterialCommunityIcons name="tag-plus-outline" size={32} color="#16A34A" />
              </View>
              <Text style={styles.emptyFeedTitle}>
                {isUrdu ? 'آپ کی دکان ابھی خالی ہے' : 'Start Selling to Local Farmers'}
              </Text>
              <Text style={styles.emptyFeedText}>
                {isUrdu ? 'آپ نے ابھی تک کوئی چیز فروخت کے لیے نہیں لگائی۔' : 'List surplus seeds, fertilizer bags, or harvest grain to connect directly with buyers.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionCta}
                activeOpacity={0.85}
                onPress={() => setIsSellModalOpen(true)}>
                <Ionicons name="pricetag-outline" size={17} color="#FFFFFF" />
                <Text style={styles.emptyActionCtaText}>
                  {isUrdu ? '+ فروخت کے لیے لگائیں' : '+ Create First Listing'}
                </Text>
              </TouchableOpacity>
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
      <Modal visible={!!selectedItem} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                style={styles.backBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>{isUrdu ? 'تفصیلات' : 'Listing Details'}</Text>
              <View style={{ width: 40 }} />
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
                  <View style={styles.conditionTagInline}>
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
                <TouchableOpacity
                  style={styles.sellerCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedSellerUserId(selectedItem.seller_id);
                    setSelectedSellerInitialData({
                      full_name: selectedItem.seller_name,
                      district: selectedItem.district,
                      phone_number: selectedItem.seller_phone,
                    });
                  }}>
                  <View style={styles.sellerAvatar}>
                    <Text style={styles.avatarInitials}>{selectedItem.seller_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.sellerName}>{selectedItem.seller_name}</Text>
                      <View style={styles.viewProfileChip}>
                        <Text style={styles.viewProfileChipText}>{isUrdu ? 'پروفائل' : 'Profile'}</Text>
                        <Ionicons name="chevron-forward" size={13} color="#16A34A" />
                      </View>
                    </View>
                    <Text style={styles.sellerDistrict}>{selectedItem.district} · Verified Farmer</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Thumb-Zone Sticky Contact & Chat Dock */}
            <View style={styles.detailStickyDock}>
              <TouchableOpacity
                style={[styles.chatSellerBtn, isStartingChat && { opacity: 0.7 }]}
                disabled={isStartingChat}
                activeOpacity={0.85}
                onPress={() => handleChatWithSeller(selectedItem)}>
                {isStartingChat ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                    <Text style={styles.chatSellerBtnText}>{isUrdu ? 'چیٹ میں بات کریں' : 'Chat with Seller'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callSellerBtn}
                activeOpacity={0.85}
                onPress={() => handleCallSeller(selectedItem.seller_phone)}>
                <Ionicons name="call" size={19} color="#FFFFFF" />
                <Text style={styles.callSellerBtnText}>{isUrdu ? 'فون کال' : 'Call'}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* Post / Sell Item Modal */}
      <Modal visible={isSellModalOpen} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setIsSellModalOpen(false)}>
        <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => setIsSellModalOpen(false)}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isUrdu ? 'مارکیٹ میں چیز لسٹ کریں' : 'Sell Agricultural Product'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.feedScroll}
            contentContainerStyle={styles.feedContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>{isUrdu ? 'پروڈکٹ کا نام *' : 'Item Title *'}</Text>
            <TextInput
              style={styles.formInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Certified Akbar-2019 Wheat Seed (50kg)"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'زمرہ (Category)' : 'Category'}</Text>
            <View style={styles.typeSelectorRow}>
              {MARKET_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.typeOptionPill, newCategory === cat.key && styles.typeOptionPillActive]}
                  onPress={() => setNewCategory(cat.key)}>
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={14}
                    color={newCategory === cat.key ? '#FFFFFF' : '#475569'}
                  />
                  <Text style={[styles.typeOptionText, newCategory === cat.key && styles.typeOptionTextActive]}>
                    {isUrdu ? cat.labelUr : cat.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{isUrdu ? 'حالت (Condition)' : 'Condition'}</Text>
            <View style={styles.typeSelectorRow}>
              {CONDITION_CHIPS.map((cond) => (
                <TouchableOpacity
                  key={cond.key}
                  style={[styles.typeOptionPill, newCondition === cond.key && styles.typeOptionPillActive]}
                  onPress={() => setNewCondition(cond.key)}>
                  <Text style={[styles.typeOptionText, newCondition === cond.key && styles.typeOptionTextActive]}>
                    {isUrdu ? cond.labelUr : cond.labelEn}
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
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>{isUrdu ? 'ضلع / علاقہ *' : 'District *'}</Text>
            <View style={styles.typeSelectorRow}>
              {MARKET_DISTRICTS.map((dist) => (
                <TouchableOpacity
                  key={dist}
                  style={[styles.typeOptionPill, newDistrict === dist && styles.typeOptionPillActive]}
                  onPress={() => setNewDistrict(dist)}>
                  <Ionicons name="location-outline" size={13} color={newDistrict === dist ? '#FFFFFF' : '#64748B'} />
                  <Text style={[styles.typeOptionText, newDistrict === dist && styles.typeOptionTextActive]}>
                    {dist}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.formInput}
              value={newDistrict}
              onChangeText={setNewDistrict}
              placeholder="Faisalabad"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'مقام / دکان کا پتہ (اختیاری)' : 'Location / Shop Address (Optional)'}</Text>
            <TextInput
              style={styles.formInput}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Grain Market, Jhang Road"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'تفصیل *' : 'Description *'}</Text>
            <TextInput
              style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Provide quality, certification details, bags available..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'تصویر کا لنک (اختیاری)' : 'Product Photo URL (Optional)'}</Text>
            <TextInput
              style={styles.formInput}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder="https://images.unsplash.com/..."
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={[
                styles.submitPostBtn,
                sellStatus === 'success' && { backgroundColor: '#15803D' },
                sellStatus === 'sending' && { opacity: 0.7 },
              ]}
              disabled={sellStatus === 'sending' || sellStatus === 'success'}
              activeOpacity={0.85}
              onPress={handlePostItem}>
              {sellStatus === 'sending' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitPostBtnText}>{isUrdu ? 'شائع ہو رہا ہے...' : 'Publishing...'}</Text>
                </>
              ) : sellStatus === 'success' ? (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.submitPostBtnText}>{isUrdu ? 'شائع ہو گیا!' : 'Listed Successfully!'}</Text>
                </>
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Seller Public Profile Modal */}
      <UserProfileModal
        visible={!!selectedSellerUserId}
        userId={selectedSellerUserId}
        initialData={selectedSellerInitialData}
        onClose={() => {
          setSelectedSellerUserId(null);
          setSelectedSellerInitialData(undefined);
        }}
        onStartChat={handleStartChatFromProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    gap: 5,
    backgroundColor: '#16A34A',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    ...PrimaryButtonShadow,
  },
  sellItemBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontFamily: FontFamily.medium,
  },
  quickSearchScroll: {
    paddingTop: 8,
    gap: 6,
  },
  quickSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSearchChipActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
    borderColor: '#16A34A',
  },
  quickSearchChipText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  quickSearchChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#15803D',
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
    minHeight: 40,
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#16A34A',
  },
  toggleBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
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
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
  },
  gridContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    ...CardStyle,
    width: '48%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 124,
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
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  conditionTagInline: {
    backgroundColor: '#0F172A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  conditionTagText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 12,
  },
  productPrice: {
    ...MetricNumberStyle,
    fontSize: 16,
    color: '#16A34A',
  },
  productTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    marginTop: 3,
    lineHeight: 17,
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
    color: 'rgba(15, 23, 42, 0.62)',
    flex: 1,
  },
  feedContent: {
    padding: 16,
    paddingBottom: 40,
  },
  myListingCard: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  myListingTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  myListingPrice: {
    ...MetricNumberStyle,
    fontSize: 15,
    color: '#16A34A',
    marginTop: 3,
  },
  myListingStatus: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 4,
  },
  toggleSoldBtn: {
    backgroundColor: '#DCFCE7',
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  toggleSoldBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  deleteListingBtn: {
    alignSelf: 'flex-end',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  detailContent: {
    paddingBottom: 24,
  },
  detailImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  detailMainBox: {
    padding: 20,
  },
  detailPrice: {
    ...MetricNumberStyle,
    fontSize: 24,
    color: '#16A34A',
  },
  detailTitle: {
    fontSize: 18,
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
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  detailLocation: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(15, 23, 42, 0.62)',
  },
  detailAddress: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.80)',
    marginTop: 8,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.80)',
  },
  sellerCard: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: 16,
    marginTop: 20,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  sellerName: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  sellerDistrict: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 1,
  },
  viewProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  viewProfileChipText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  detailStickyDock: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 8,
  },
  chatSellerBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    minHeight: 50,
    paddingVertical: 13,
    borderRadius: Radius.md,
    ...PrimaryButtonShadow,
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
    minHeight: 50,
    paddingVertical: 13,
    borderRadius: Radius.md,
  },
  callSellerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 46,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typeOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeOptionText: {
    fontSize: 12,
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
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: 24,
    ...PrimaryButtonShadow,
  },
  submitPostBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
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
    ...CardStyle,
    borderRadius: Radius.xl,
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyFeedText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.62)',
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyActionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    minHeight: 46,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radius.full,
    marginTop: 8,
    ...PrimaryButtonShadow,
  },
  emptyActionCtaText: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
