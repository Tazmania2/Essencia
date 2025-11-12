'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ItemGrid } from '../../components/store/ItemGrid';
import { ItemModal } from '../../components/store/ItemModal';
import { storeService } from '../../services/store.service';
import { virtualGoodsService } from '../../services/virtual-goods.service';
import { pointsService } from '../../services/points.service';
import { VirtualGoodItem, StoreConfiguration, STORE_ERROR_MESSAGES } from '../../types';
import { secureLogger } from '../../utils/logger';

export default function StorefrontPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <StorefrontContent />
    </ProtectedRoute>
  );
}

function StorefrontContent() {
  const router = useRouter();
  const { user, showTeamSelection, selectedTeam, isLoading: authLoading } = useAuth();
  
  // State management
  const [storeConfig, setStoreConfig] = useState<StoreConfiguration | null>(null);
  const [items, setItems] = useState<VirtualGoodItem[]>([]);
  const [playerBalances, setPlayerBalances] = useState<Record<string, number>>({});
  const [playerCatalogItems, setPlayerCatalogItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VirtualGoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered and grouped items
  const [filteredItems, setFilteredItems] = useState<VirtualGoodItem[]>([]);
  const [itemsByLevel, setItemsByLevel] = useState<Map<string, VirtualGoodItem[]>>(new Map());

  // Redirect if team selection is in progress
  useEffect(() => {
    if (showTeamSelection) {
      secureLogger.log('⚠️ Team selection in progress, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [showTeamSelection, router]);

  // Redirect if no valid team is selected (but only after auth is loaded)
  useEffect(() => {
    if (!authLoading && (!selectedTeam || selectedTeam === 'ADMIN')) {
      secureLogger.log('⚠️ No valid team selected for store access, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [selectedTeam, authLoading, router]);

  // Fetch store data function
  const fetchStoreData = async () => {
      if (!user?.userId) {
        secureLogger.log('⚠️ No user ID available, cannot fetch store data');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        secureLogger.log('🛍️ Fetching store data...');

        // Fetch store configuration
        secureLogger.log('📋 Fetching store configuration...');
        const config = await storeService.getStoreConfiguration();
        setStoreConfig(config);
        secureLogger.log('✅ Store configuration loaded:', config);

        // Fetch virtual goods items
        secureLogger.log('🎁 Fetching virtual goods items...');
        const allItems = await virtualGoodsService.getVirtualGoodsItems();
        setItems(allItems);
        secureLogger.log(`✅ Loaded ${allItems.length} virtual goods items`);

        // Fetch player balances for all currencies used in visible levels
        secureLogger.log('💰 Fetching player balances for all currencies...');
        const balances: Record<string, number> = {};
        const uniqueCurrencies = new Set(
          config.levels
            .filter(level => level.visible)
            .map(level => level.currencyId)
        );

        for (const currencyId of uniqueCurrencies) {
          try {
            const balance = await pointsService.getPlayerBalance(user.userId, currencyId);
            balances[currencyId] = balance;
            secureLogger.log(`✅ Balance loaded for ${currencyId}: ${balance}`);
          } catch (balanceError) {
            secureLogger.error(`❌ Error fetching balance for ${currencyId}:`, balanceError);
            balances[currencyId] = 0;
          }
        }
        setPlayerBalances(balances);

        // Fetch player's owned catalog items for level access checking
        secureLogger.log('🎁 Fetching player catalog items...');
        try {
          const catalogItems = await pointsService.getPlayerCatalogItems(user.userId);
          setPlayerCatalogItems(catalogItems);
          secureLogger.log(`✅ Player catalog items loaded:`, catalogItems);
        } catch (catalogError) {
          secureLogger.error('❌ Error fetching player catalog items:', catalogError);
          // Don't fail the entire page if catalog items fetch fails
          setPlayerCatalogItems({});
        }

        secureLogger.log('✅ Store data loaded successfully');
      } catch (err) {
        secureLogger.error('❌ Error fetching store data:', err);
        setError(err instanceof Error ? err.message : STORE_ERROR_MESSAGES.FETCH_ITEMS_FAILED);
      } finally {
        setLoading(false);
      }
    };

  // Fetch data on mount
  useEffect(() => {
    fetchStoreData();
  }, [user?.userId]);

  // Retry function for error recovery
  const handleRetry = () => {
    fetchStoreData();
  };

  // Filter and group items when data changes
  useEffect(() => {
    if (!storeConfig || items.length === 0) {
      return;
    }

    try {
      secureLogger.log('🔍 Filtering and grouping items...');

      // Get visible levels
      const visibleLevels = storeConfig.levels.filter(level => level.visible);
      
      // Filter items by level-specific currency and catalog
      const allVisibleItems: VirtualGoodItem[] = [];
      const grouped = new Map<string, VirtualGoodItem[]>();

      for (const level of visibleLevels) {
        // Filter items by this level's currency
        const itemsWithCurrency = virtualGoodsService.filterItemsByCurrency(items, level.currencyId);
        
        // Filter items by this level's catalog
        const levelItems = itemsWithCurrency.filter(item => item.catalogId === level.catalogId);
        
        secureLogger.log(`✅ Level ${level.levelNumber} (${level.levelName}): ${levelItems.length} items with currency ${level.currencyId}`);
        
        if (levelItems.length > 0) {
          grouped.set(level.catalogId, levelItems);
          allVisibleItems.push(...levelItems);
        }
      }

      setFilteredItems(allVisibleItems);
      setItemsByLevel(grouped);
      secureLogger.log(`✅ Grouped items into ${grouped.size} catalogs with ${allVisibleItems.length} total items`);

    } catch (err) {
      secureLogger.error('❌ Error filtering and grouping items:', err);
    }
  }, [storeConfig, items]);

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  const handleItemClick = (item: VirtualGoodItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Get level info for selected item
  const getSelectedItemLevel = () => {
    if (!selectedItem || !storeConfig) return null;
    
    const level = storeConfig.levels.find(l => l.catalogId === selectedItem.catalogId);
    return level || null;
  };

  // Show loading while auth is initializing or team selection is in progress
  if (authLoading || showTeamSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boticario-pink mx-auto mb-4"></div>
          <p className="text-gray-600">
            {showTeamSelection ? 'Aguardando seleção de equipe...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if no valid team is selected
  if (!selectedTeam || selectedTeam === 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Acesso negado. Você precisa selecionar uma equipe válida para acessar a loja.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-boticario-pink text-white px-6 py-2 rounded-lg hover:bg-boticario-purple transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Row: Back Button and Title */}
          <div className="flex items-center justify-between mb-4">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-boticario-purple transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium hidden sm:inline">Voltar</span>
            </button>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              🏪 Loja
            </h1>

            {/* Spacer for alignment */}
            <div className="w-20 sm:w-24"></div>
          </div>

          {/* Currency Balances Row */}
          {storeConfig && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {storeConfig.levels
                .filter(level => level.visible)
                .sort((a, b) => a.levelNumber - b.levelNumber)
                .map((level) => {
                  const balance = playerBalances[level.currencyId] || 0;
                  const currencyEmoji = level.levelNumber === 1 ? '💰' : level.levelNumber === 2 ? '🥇' : '💎';
                  
                  return (
                    <div
                      key={level.currencyId}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-full shadow-lg"
                    >
                      <span className="text-lg">{currencyEmoji}</span>
                      <div className="text-right">
                        <div className="font-bold text-sm md:text-base">
                          {loading ? '...' : balance.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs opacity-90">
                          {level.currencyName}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-boticario-pink mb-4"></div>
            <p className="text-gray-600 text-lg">Carregando loja...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar loja</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {STORE_ERROR_MESSAGES.NO_ITEMS_AVAILABLE}
            </h3>
            <p className="text-gray-500 mb-4">
              Não há itens disponíveis para exibição no momento.
            </p>
            <button
              onClick={handleRetry}
              className="bg-boticario-purple text-white px-6 py-2 rounded-lg hover:bg-boticario-pink transition-colors"
            >
              Atualizar
            </button>
          </div>
        )}

        {!loading && !error && storeConfig && (
          <ItemGrid
            itemsByLevel={itemsByLevel}
            levelConfig={storeConfig.levels}
            onItemClick={handleItemClick}
            grayOutLocked={storeConfig.grayOutLocked}
            playerCatalogItems={playerCatalogItems}
          />
        )}
      </div>

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        levelName={getSelectedItemLevel()?.levelName || ''}
        currencyName={getSelectedItemLevel()?.currencyName || 'Moedas'}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
