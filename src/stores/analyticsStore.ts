import { create } from 'zustand';
import type {
  PerformanceMetrics,
  SalesAnalytics,
  CustomerAnalytics,
  AnalyticsFilters,
  TimeRange,
  DataGranularity,
  Insight,
  Dashboard,
  AnalyticsReport
} from '../types/Analytics';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsState {
  // Data state
  performanceMetrics: PerformanceMetrics | null;
  salesAnalytics: SalesAnalytics | null;
  customerAnalytics: CustomerAnalytics | null;
  insights: Insight[];
  dashboards: Dashboard[];
  reports: AnalyticsReport[];

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters and settings
  timeRange: TimeRange;
  granularity: DataGranularity;
  filters: AnalyticsFilters;
  autoRefresh: boolean;
  refreshInterval: number; // seconds

  // Actions
  loadPerformanceMetrics: () => Promise<void>;
  loadSalesAnalytics: () => Promise<void>;
  loadCustomerAnalytics: () => Promise<void>;
  loadInsights: () => Promise<void>;
  loadAllAnalytics: () => Promise<void>;

  // Filter actions
  setTimeRange: (range: TimeRange) => void;
  setGranularity: (granularity: DataGranularity) => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  setDateRange: (start: Date, end: Date) => void;

  // Settings
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;

  // Utility
  refresh: () => Promise<void>;
  clearError: () => void;
  exportData: (format: 'json' | 'csv' | 'pdf') => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial state
  performanceMetrics: null,
  salesAnalytics: null,
  customerAnalytics: null,
  insights: [],
  dashboards: [],
  reports: [],

  isLoading: false,
  error: null,
  lastUpdated: null,

  timeRange: '30d',
  granularity: 'day',
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    granularity: 'day',
  },
  autoRefresh: false,
  refreshInterval: 300, // 5 minutes

  // Load performance metrics
  loadPerformanceMetrics: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const metrics = await analyticsService.calculatePerformanceMetrics(filters);
      set({
        performanceMetrics: metrics,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      set({
        error: 'Erro ao carregar métricas de performance',
        isLoading: false
      });
    }
  },

  // Load sales analytics
  loadSalesAnalytics: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const analytics = await analyticsService.calculateSalesAnalytics(filters);
      set({
        salesAnalytics: analytics,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading sales analytics:', error);
      set({
        error: 'Erro ao carregar analytics de vendas',
        isLoading: false
      });
    }
  },

  // Load customer analytics
  loadCustomerAnalytics: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const analytics = await analyticsService.calculateCustomerAnalytics(filters);
      set({
        customerAnalytics: analytics,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      set({
        error: 'Erro ao carregar analytics de clientes',
        isLoading: false
      });
    }
  },

  // Load insights
  loadInsights: async () => {
    const { performanceMetrics } = get();

    if (!performanceMetrics) {
      await get().loadPerformanceMetrics();
    }

    try {
      const updatedMetrics = get().performanceMetrics;
      if (updatedMetrics) {
        const insights = await analyticsService.generateInsights(updatedMetrics);
        set({ insights });
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      set({ error: 'Erro ao carregar insights' });
    }
  },

  // Load all analytics data
  loadAllAnalytics: async () => {
    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().loadPerformanceMetrics(),
        get().loadSalesAnalytics(),
        get().loadCustomerAnalytics(),
      ]);

      await get().loadInsights();

      set({
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading all analytics:', error);
      set({
        error: 'Erro ao carregar dados de analytics',
        isLoading: false
      });
    }
  },

  // Set time range
  setTimeRange: (range: TimeRange) => {
    let start: Date;
    const end = new Date();

    switch (range) {
      case '24h':
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return; // Custom range should use setDateRange
    }

    set({
      timeRange: range,
      filters: {
        ...get().filters,
        dateRange: { start, end }
      }
    });

    // Auto-reload data
    get().loadAllAnalytics();
  },

  // Set granularity
  setGranularity: (granularity: DataGranularity) => {
    set({
      granularity,
      filters: {
        ...get().filters,
        granularity
      }
    });

    // Reload data with new granularity
    get().loadAllAnalytics();
  },

  // Set filters
  setFilters: (newFilters: Partial<AnalyticsFilters>) => {
    set({
      filters: {
        ...get().filters,
        ...newFilters
      }
    });

    // Reload data with new filters
    get().loadAllAnalytics();
  },

  // Set custom date range
  setDateRange: (start: Date, end: Date) => {
    set({
      timeRange: 'custom',
      filters: {
        ...get().filters,
        dateRange: { start, end }
      }
    });

    // Reload data
    get().loadAllAnalytics();
  },

  // Set auto refresh
  setAutoRefresh: (enabled: boolean) => {
    set({ autoRefresh: enabled });

    if (enabled) {
      const interval = setInterval(() => {
        if (get().autoRefresh) {
          get().refresh();
        }
      }, get().refreshInterval * 1000);

      // Store interval ID for cleanup (in a real app, you'd want proper cleanup)
      (window as any).analyticsRefreshInterval = interval;
    } else {
      if ((window as any).analyticsRefreshInterval) {
        clearInterval((window as any).analyticsRefreshInterval);
      }
    }
  },

  // Set refresh interval
  setRefreshInterval: (seconds: number) => {
    set({ refreshInterval: seconds });

    // Restart auto-refresh with new interval
    if (get().autoRefresh) {
      get().setAutoRefresh(false);
      get().setAutoRefresh(true);
    }
  },

  // Refresh all data
  refresh: async () => {
    await get().loadAllAnalytics();
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Export data
  exportData: async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const { performanceMetrics, salesAnalytics, customerAnalytics, insights } = get();

      const exportData = {
        timestamp: new Date().toISOString(),
        performanceMetrics,
        salesAnalytics,
        customerAnalytics,
        insights,
      };

      switch (format) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          URL.revokeObjectURL(jsonUrl);
          break;

        case 'csv':
          // Convert key metrics to CSV format
          const csvData = [
            ['Métrica', 'Valor Atual', 'Valor Anterior', 'Mudança %'],
            ['Receita Total', performanceMetrics?.totalRevenue.value || 0, performanceMetrics?.totalRevenue.previousValue || 0, performanceMetrics?.totalRevenue.changePercent || 0],
            ['Total de Pedidos', performanceMetrics?.totalOrders.value || 0, performanceMetrics?.totalOrders.previousValue || 0, performanceMetrics?.totalOrders.changePercent || 0],
            ['Valor Médio do Pedido', performanceMetrics?.averageOrderValue.value || 0, performanceMetrics?.averageOrderValue.previousValue || 0, performanceMetrics?.averageOrderValue.changePercent || 0],
            ['Taxa de Conversão', performanceMetrics?.conversionRate.value || 0, performanceMetrics?.conversionRate.previousValue || 0, performanceMetrics?.conversionRate.changePercent || 0],
          ];

          const csvContent = csvData.map(row => row.join(',')).join('\n');
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(csvLink);
          csvLink.click();
          document.body.removeChild(csvLink);
          URL.revokeObjectURL(csvUrl);
          break;

        case 'pdf':
          // For PDF export, you would typically use a library like jsPDF
          // For now, we'll create a simple HTML report
          const htmlContent = `
            <html>
              <head><title>Relatório de Analytics</title></head>
              <body>
                <h1>Relatório de Analytics - ${new Date().toLocaleDateString('pt-BR')}</h1>
                <h2>Métricas de Performance</h2>
                <p>Receita Total: R$ ${performanceMetrics?.totalRevenue.value?.toFixed(2) || 0}</p>
                <p>Total de Pedidos: ${performanceMetrics?.totalOrders.value || 0}</p>
                <p>Valor Médio do Pedido: R$ ${performanceMetrics?.averageOrderValue.value?.toFixed(2) || 0}</p>
                <h2>Insights</h2>
                ${insights.map(insight => `<p><strong>${insight.title}</strong>: ${insight.description}</p>`).join('')}
              </body>
            </html>
          `;

          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          const htmlUrl = URL.createObjectURL(htmlBlob);
          const htmlLink = document.createElement('a');
          htmlLink.href = htmlUrl;
          htmlLink.download = `analytics_report_${new Date().toISOString().split('T')[0]}.html`;
          document.body.appendChild(htmlLink);
          htmlLink.click();
          document.body.removeChild(htmlLink);
          URL.revokeObjectURL(htmlUrl);
          break;
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      set({ error: 'Erro ao exportar dados' });
    }
  },
}));
