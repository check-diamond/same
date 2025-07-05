import {
  type PerformanceMetrics,
  type SalesAnalytics,
  type CustomerAnalytics,
  type AnalyticsFilters,
  type MetricValue,
  type DataPoint,
  type Insight,
  Dashboard,
  AnalyticsReport,
  TimeRange
} from '../types/Analytics';
import { useDataStore } from '../stores/data';

class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Main analytics calculation
  async calculatePerformanceMetrics(filters: AnalyticsFilters): Promise<PerformanceMetrics> {
    const cacheKey = `performance_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const dataStore = useDataStore.getState();
    const { vendas, estoque, revendedores } = dataStore;

    // Filter data based on date range
    const filteredSales = this.filterSalesByDateRange(vendas || [], filters.dateRange);
    const previousPeriodSales = this.getPreviousPeriodSales(vendas || [], filters.dateRange);

    const metrics: PerformanceMetrics = {
      // Revenue metrics
      totalRevenue: this.calculateRevenue(filteredSales, previousPeriodSales),
      averageOrderValue: this.calculateAverageOrderValue(filteredSales, previousPeriodSales),
      revenueGrowthRate: this.calculateGrowthRate(filteredSales, previousPeriodSales, 'revenue'),
      monthlyRecurringRevenue: this.calculateMRR(filteredSales, previousPeriodSales),

      // Sales metrics
      totalOrders: this.calculateTotalOrders(filteredSales, previousPeriodSales),
      conversionRate: this.calculateConversionRate(filteredSales, previousPeriodSales),
      orderFulfillmentTime: this.calculateFulfillmentTime(filteredSales, previousPeriodSales),
      refundRate: this.calculateRefundRate(filteredSales, previousPeriodSales),

      // Customer metrics
      totalCustomers: this.calculateTotalCustomers(filteredSales, previousPeriodSales),
      newCustomers: this.calculateNewCustomers(filteredSales, previousPeriodSales),
      customerRetentionRate: this.calculateRetentionRate(filteredSales, previousPeriodSales),
      customerLifetimeValue: this.calculateCLV(filteredSales, previousPeriodSales),

      // Product metrics
      topSellingProducts: this.calculateTopProducts(filteredSales),
      inventoryTurnover: this.calculateInventoryTurnover(filteredSales, Array.isArray(estoque) ? estoque : (estoque ? [estoque] : []), previousPeriodSales),
      stockoutRate: this.calculateStockoutRate(Array.isArray(estoque) ? estoque : (estoque ? [estoque] : [])),

      // Payment metrics
      paymentSuccessRate: this.calculatePaymentSuccessRate(filteredSales, previousPeriodSales),
      averagePaymentTime: this.calculatePaymentTime(filteredSales, previousPeriodSales),
      pixUsageRate: this.calculatePixUsage(filteredSales, previousPeriodSales),

      // System metrics
      systemUptime: this.calculateSystemUptime(),
      averageResponseTime: this.calculateResponseTime(),
      errorRate: this.calculateErrorRate(),
    };

    this.setCachedData(cacheKey, metrics);
    return metrics;
  }

  async calculateSalesAnalytics(filters: AnalyticsFilters): Promise<SalesAnalytics> {
    const cacheKey = `sales_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const dataStore = useDataStore.getState();
    const vendas = dataStore.vendas || [];
    const filteredSales = this.filterSalesByDateRange(vendas, filters.dateRange);

    const analytics: SalesAnalytics = {
      totalSales: filteredSales.reduce((sum, sale) => sum + (sale.valor || 0), 0),
      salesGrowth: this.calculateSalesGrowth(filteredSales, filters),
      topProducts: this.getTopProducts(filteredSales),
      salesByPeriod: this.getSalesByPeriod(filteredSales, filters.granularity),
      salesByRegion: this.getSalesByRegion(filteredSales),
      salesByPaymentMethod: this.getSalesByPaymentMethod(filteredSales),
      conversionFunnel: this.getConversionFunnel(filteredSales),
    };

    this.setCachedData(cacheKey, analytics);
    return analytics;
  }

  async calculateCustomerAnalytics(filters: AnalyticsFilters): Promise<CustomerAnalytics> {
    const cacheKey = `customers_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const dataStore = useDataStore.getState();
    const vendas = dataStore.vendas || [];
    const filteredSales = this.filterSalesByDateRange(vendas, filters.dateRange);

    const customers = this.extractCustomers(filteredSales);
    const previousCustomers = this.extractCustomers(
      this.getPreviousPeriodSales(vendas, filters.dateRange)
    );

    const analytics: CustomerAnalytics = {
      totalCustomers: customers.length,
      newCustomers: this.calculateNewCustomersCount(customers, previousCustomers),
      returningCustomers: this.calculateReturningCustomers(customers),
      customerGrowthRate: this.calculateCustomerGrowthRate(customers, previousCustomers),
      averageOrderValue: this.calculateCustomerAOV(filteredSales),
      customerLifetimeValue: this.calculateCustomerCLV(filteredSales),
      churnRate: this.calculateChurnRate(customers, previousCustomers),
      customerSegments: this.getCustomerSegments(filteredSales),
      customerJourney: this.getCustomerJourney(filteredSales),
    };

    this.setCachedData(cacheKey, analytics);
    return analytics;
  }

  async generateInsights(metrics: PerformanceMetrics): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Revenue insights
    if (metrics.totalRevenue.changePercent && metrics.totalRevenue.changePercent > 20) {
      insights.push({
        id: 'revenue_growth',
        type: 'achievement',
        title: 'Crescimento de receita excepcional',
        description: `A receita cresceu ${metrics.totalRevenue.changePercent.toFixed(1)}% comparado ao período anterior`,
        impact: 'high',
        confidence: 95,
        recommendations: [
          'Considere expandir os canais de venda que estão performando melhor',
          'Invista em marketing para manter o momentum',
          'Analise quais produtos estão impulsionando esse crescimento'
        ],
        relatedMetrics: ['totalRevenue', 'totalOrders'],
        timestamp: new Date(),
      });
    }

    // Conversion rate insights
    if (metrics.conversionRate.value < 0.02) { // Less than 2%
      insights.push({
        id: 'low_conversion',
        type: 'warning',
        title: 'Taxa de conversão baixa',
        description: `A taxa de conversão atual de ${(metrics.conversionRate.value * 100).toFixed(1)}% está abaixo do esperado`,
        impact: 'high',
        confidence: 85,
        recommendations: [
          'Otimize o processo de checkout',
          'Melhore a experiência do usuário no site',
          'Implemente testes A/B nas páginas de produto',
          'Revise a estratégia de preços'
        ],
        relatedMetrics: ['conversionRate', 'averageOrderValue'],
        timestamp: new Date(),
      });
    }

    // Customer retention insights
    if (metrics.customerRetentionRate.value < 0.3) { // Less than 30%
      insights.push({
        id: 'low_retention',
        type: 'opportunity',
        title: 'Oportunidade de melhorar retenção',
        description: `A taxa de retenção de ${(metrics.customerRetentionRate.value * 100).toFixed(1)}% pode ser melhorada`,
        impact: 'medium',
        confidence: 80,
        recommendations: [
          'Implemente um programa de fidelidade',
          'Envie emails de follow-up pós-compra',
          'Ofereça descontos para clientes recorrentes',
          'Melhore o atendimento ao cliente'
        ],
        relatedMetrics: ['customerRetentionRate', 'customerLifetimeValue'],
        timestamp: new Date(),
      });
    }

    // Payment insights
    if (metrics.paymentSuccessRate.value < 0.9) { // Less than 90%
      insights.push({
        id: 'payment_issues',
        type: 'warning',
        title: 'Problemas na taxa de sucesso de pagamentos',
        description: `${(metrics.paymentSuccessRate.value * 100).toFixed(1)}% de taxa de sucesso indica possíveis problemas`,
        impact: 'high',
        confidence: 90,
        recommendations: [
          'Verifique a configuração do gateway de pagamento',
          'Adicione métodos de pagamento alternativos',
          'Melhore a validação de dados no checkout',
          'Monitore logs de erro de pagamento'
        ],
        relatedMetrics: ['paymentSuccessRate', 'pixUsageRate'],
        timestamp: new Date(),
      });
    }

    // Stock insights
    if (metrics.stockoutRate.value > 0.1) { // More than 10%
      insights.push({
        id: 'stock_issues',
        type: 'warning',
        title: 'Alta taxa de produtos em falta',
        description: `${(metrics.stockoutRate.value * 100).toFixed(1)}% dos produtos estão em falta`,
        impact: 'medium',
        confidence: 95,
        recommendations: [
          'Revise o sistema de reposição de estoque',
          'Implemente alertas automáticos de estoque baixo',
          'Analise a demanda histórica para melhor planejamento',
          'Considere aumentar o estoque de segurança'
        ],
        relatedMetrics: ['stockoutRate', 'inventoryTurnover'],
        timestamp: new Date(),
      });
    }

    return insights;
  }

  // Utility methods for calculations
  private calculateRevenue(current: any[], previous: any[]): MetricValue {
    const currentRevenue = current.reduce((sum, sale) => sum + (sale.valor || 0), 0);
    const previousRevenue = previous.reduce((sum, sale) => sum + (sale.valor || 0), 0);

    return {
      value: currentRevenue,
      previousValue: previousRevenue,
      changePercent: this.calculatePercentChange(currentRevenue, previousRevenue),
      changeType: currentRevenue > previousRevenue ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculateAverageOrderValue(current: any[], previous: any[]): MetricValue {
    const currentAOV = current.length > 0
      ? current.reduce((sum, sale) => sum + (sale.valor || 0), 0) / current.length
      : 0;
    const previousAOV = previous.length > 0
      ? previous.reduce((sum, sale) => sum + (sale.valor || 0), 0) / previous.length
      : 0;

    return {
      value: currentAOV,
      previousValue: previousAOV,
      changePercent: this.calculatePercentChange(currentAOV, previousAOV),
      changeType: currentAOV > previousAOV ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculateTotalOrders(current: any[], previous: any[]): MetricValue {
    return {
      value: current.length,
      previousValue: previous.length,
      changePercent: this.calculatePercentChange(current.length, previous.length),
      changeType: current.length > previous.length ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculateConversionRate(current: any[], previous: any[]): MetricValue {
    // Mock conversion rate calculation (would need traffic data in real implementation)
    const currentRate = Math.random() * 0.05 + 0.02; // 2-7%
    const previousRate = Math.random() * 0.05 + 0.02;

    return {
      value: currentRate,
      previousValue: previousRate,
      changePercent: this.calculatePercentChange(currentRate, previousRate),
      changeType: currentRate > previousRate ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private filterSalesByDateRange(sales: any[], dateRange: { start: Date; end: Date }): any[] {
    return sales.filter(sale => {
      const saleDate = new Date(sale.data || sale.createdAt || Date.now());
      return saleDate >= dateRange.start && saleDate <= dateRange.end;
    });
  }

  private getPreviousPeriodSales(sales: any[], dateRange: { start: Date; end: Date }): any[] {
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const previousStart = new Date(dateRange.start.getTime() - periodLength);
    const previousEnd = new Date(dateRange.start.getTime());

    return this.filterSalesByDateRange(sales, { start: previousStart, end: previousEnd });
  }

  // Cache management
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  // Additional calculation methods (simplified for brevity)
  private calculateGrowthRate(current: any[], previous: any[], metric: string): MetricValue {
    const currentValue = this.getMetricValue(current, metric);
    const previousValue = this.getMetricValue(previous, metric);

    return {
      value: this.calculatePercentChange(currentValue, previousValue) / 100,
      previousValue: 0,
      changePercent: 0,
      changeType: 'neutral',
      timestamp: new Date(),
    };
  }

  private calculateMRR(current: any[], previous: any[]): MetricValue {
    // Mock MRR calculation
    const currentMRR = current.reduce((sum, sale) => sum + (sale.valor || 0), 0);
    const previousMRR = previous.reduce((sum, sale) => sum + (sale.valor || 0), 0);

    return {
      value: currentMRR,
      previousValue: previousMRR,
      changePercent: this.calculatePercentChange(currentMRR, previousMRR),
      changeType: currentMRR > previousMRR ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private getMetricValue(data: any[], metric: string): number {
    switch (metric) {
      case 'revenue':
        return data.reduce((sum, item) => sum + (item.valor || 0), 0);
      case 'orders':
        return data.length;
      default:
        return 0;
    }
  }

  // Mock implementations for other metrics (would be more complex in real app)
  private calculateFulfillmentTime(current: any[], previous: any[]): MetricValue {
    return { value: 24, previousValue: 26, changePercent: -7.7, changeType: 'increase', timestamp: new Date() };
  }

  private calculateRefundRate(current: any[], previous: any[]): MetricValue {
    return { value: 0.02, previousValue: 0.025, changePercent: -20, changeType: 'increase', timestamp: new Date() };
  }

  private calculateTotalCustomers(current: any[], previous: any[]): MetricValue {
    const uniqueCustomers = new Set(current.map(sale => sale.kwaiId || sale.kwaiLink)).size;
    const previousCustomers = new Set(previous.map(sale => sale.kwaiId || sale.kwaiLink)).size;

    return {
      value: uniqueCustomers,
      previousValue: previousCustomers,
      changePercent: this.calculatePercentChange(uniqueCustomers, previousCustomers),
      changeType: uniqueCustomers > previousCustomers ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculateNewCustomers(current: any[], previous: any[]): MetricValue {
    const currentCustomers = new Set(current.map(sale => sale.kwaiId || sale.kwaiLink));
    const previousCustomers = new Set(previous.map(sale => sale.kwaiId || sale.kwaiLink));

    const newCustomers = [...currentCustomers].filter(id => !previousCustomers.has(id)).length;

    return {
      value: newCustomers,
      previousValue: 0,
      changePercent: 0,
      changeType: 'neutral',
      timestamp: new Date(),
    };
  }

  private calculateRetentionRate(current: any[], previous: any[]): MetricValue {
    return { value: 0.35, previousValue: 0.32, changePercent: 9.4, changeType: 'increase', timestamp: new Date() };
  }

  private calculateCLV(current: any[], previous: any[]): MetricValue {
    return { value: 450, previousValue: 420, changePercent: 7.1, changeType: 'increase', timestamp: new Date() };
  }

  private calculateTopProducts(sales: any[]): DataPoint[] {
    const productCount: Record<string, number> = {};

    sales.forEach(sale => {
      const product = sale.produto || 'Produto Desconhecido';
      productCount[product] = (productCount[product] || 0) + 1;
    });

    return Object.entries(productCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([product, count]) => ({
        timestamp: new Date(),
        value: count,
        label: product,
      }));
  }

  private calculateInventoryTurnover(sales: any[], inventory: any[], previous: any[]): MetricValue {
    return { value: 4.2, previousValue: 3.8, changePercent: 10.5, changeType: 'increase', timestamp: new Date() };
  }

  private calculateStockoutRate(inventory: any[]): MetricValue {
    const outOfStock = inventory.filter(item => (item.quantidade || 0) === 0).length;
    const rate = inventory.length > 0 ? outOfStock / inventory.length : 0;

    return {
      value: rate,
      previousValue: 0.08,
      changePercent: this.calculatePercentChange(rate, 0.08),
      changeType: rate < 0.08 ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculatePaymentSuccessRate(current: any[], previous: any[]): MetricValue {
    return { value: 0.94, previousValue: 0.91, changePercent: 3.3, changeType: 'increase', timestamp: new Date() };
  }

  private calculatePaymentTime(current: any[], previous: any[]): MetricValue {
    return { value: 2.3, previousValue: 2.8, changePercent: -17.9, changeType: 'increase', timestamp: new Date() };
  }

  private calculatePixUsage(current: any[], previous: any[]): MetricValue {
    const pixSales = current.filter(sale => sale.metodoPagamento === 'pix').length;
    const rate = current.length > 0 ? pixSales / current.length : 0;

    return {
      value: rate,
      previousValue: 0.65,
      changePercent: this.calculatePercentChange(rate, 0.65),
      changeType: rate > 0.65 ? 'increase' : 'decrease',
      timestamp: new Date(),
    };
  }

  private calculateSystemUptime(): MetricValue {
    return { value: 0.999, previousValue: 0.995, changePercent: 0.4, changeType: 'increase', timestamp: new Date() };
  }

  private calculateResponseTime(): MetricValue {
    return { value: 120, previousValue: 145, changePercent: -17.2, changeType: 'increase', timestamp: new Date() };
  }

  private calculateErrorRate(): MetricValue {
    return { value: 0.001, previousValue: 0.002, changePercent: -50, changeType: 'increase', timestamp: new Date() };
  }

  // Additional helper methods for sales and customer analytics
  private calculateSalesGrowth(sales: any[], filters: AnalyticsFilters): number {
    // Simplified growth calculation
    return Math.random() * 20 + 5; // 5-25% growth
  }

  private getTopProducts(sales: any[]): Array<{ id: string; name: string; quantity: number; revenue: number }> {
    const products: Record<string, { quantity: number; revenue: number }> = {};

    sales.forEach(sale => {
      const product = sale.produto || 'Produto Desconhecido';
      if (!products[product]) {
        products[product] = { quantity: 0, revenue: 0 };
      }
      products[product].quantity += 1;
      products[product].revenue += sale.valor || 0;
    });

    return Object.entries(products)
      .map(([name, data]) => ({
        id: name,
        name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private getSalesByPeriod(sales: any[], granularity: string): DataPoint[] {
    // Group sales by period and return data points
    const grouped: Record<string, number> = {};

    sales.forEach(sale => {
      const date = new Date(sale.data || sale.createdAt || Date.now());
      let key: string;

      switch (granularity) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + (sale.valor || 0);
    });

    return Object.entries(grouped)
      .map(([date, value]) => ({
        timestamp: new Date(date),
        value,
        label: date,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getSalesByRegion(sales: any[]): DataPoint[] {
    // Mock regional data
    return [
      { timestamp: new Date(), value: 45, label: 'São Paulo' },
      { timestamp: new Date(), value: 25, label: 'Rio de Janeiro' },
      { timestamp: new Date(), value: 15, label: 'Minas Gerais' },
      { timestamp: new Date(), value: 15, label: 'Outros' },
    ];
  }

  private getSalesByPaymentMethod(sales: any[]): DataPoint[] {
    const methods: Record<string, number> = {};

    sales.forEach(sale => {
      const method = sale.metodoPagamento || 'Não informado';
      methods[method] = (methods[method] || 0) + 1;
    });

    return Object.entries(methods).map(([method, count]) => ({
      timestamp: new Date(),
      value: count,
      label: method,
    }));
  }

  private getConversionFunnel(sales: any[]): Array<{ stage: string; count: number; conversionRate: number }> {
    const totalVisitors = sales.length * 10; // Mock visitor data

    return [
      { stage: 'Visitantes', count: totalVisitors, conversionRate: 100 },
      { stage: 'Visualizaram Produto', count: Math.floor(totalVisitors * 0.6), conversionRate: 60 },
      { stage: 'Adicionaram ao Carrinho', count: Math.floor(totalVisitors * 0.15), conversionRate: 15 },
      { stage: 'Iniciaram Checkout', count: Math.floor(totalVisitors * 0.08), conversionRate: 8 },
      { stage: 'Concluíram Compra', count: sales.length, conversionRate: (sales.length / totalVisitors) * 100 },
    ];
  }

  private extractCustomers(sales: any[]): Array<{ id: string; firstPurchase: Date; totalPurchases: number; totalSpent: number }> {
    const customers: Record<string, any> = {};

    sales.forEach(sale => {
      const customerId = sale.kwaiId || sale.kwaiLink || 'anonymous';
      const saleDate = new Date(sale.data || sale.createdAt || Date.now());

      if (!customers[customerId]) {
        customers[customerId] = {
          id: customerId,
          firstPurchase: saleDate,
          totalPurchases: 0,
          totalSpent: 0,
        };
      }

      customers[customerId].totalPurchases += 1;
      customers[customerId].totalSpent += sale.valor || 0;

      if (saleDate < customers[customerId].firstPurchase) {
        customers[customerId].firstPurchase = saleDate;
      }
    });

    return Object.values(customers);
  }

  private calculateNewCustomersCount(current: any[], previous: any[]): number {
    const previousCustomerIds = new Set(previous.map(c => c.id));
    return current.filter(c => !previousCustomerIds.has(c.id)).length;
  }

  private calculateReturningCustomers(customers: any[]): number {
    return customers.filter(c => c.totalPurchases > 1).length;
  }

  private calculateCustomerGrowthRate(current: any[], previous: any[]): number {
    return this.calculatePercentChange(current.length, previous.length);
  }

  private calculateCustomerAOV(sales: any[]): number {
    return sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.valor || 0), 0) / sales.length : 0;
  }

  private calculateCustomerCLV(sales: any[]): number {
    const customers = this.extractCustomers(sales);
    const avgCLV = customers.length > 0
      ? customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / customers.length
      : 0;
    return avgCLV;
  }

  private calculateChurnRate(current: any[], previous: any[]): number {
    if (previous.length === 0) return 0;

    const currentCustomerIds = new Set(current.map(c => c.id));
    const churnedCustomers = previous.filter(c => !currentCustomerIds.has(c.id)).length;

    return (churnedCustomers / previous.length) * 100;
  }

  private getCustomerSegments(sales: any[]): Array<{ segment: string; count: number; revenue: number; characteristics: string[] }> {
    const customers = this.extractCustomers(sales);

    return [
      {
        segment: 'VIP',
        count: customers.filter(c => c.totalSpent > 1000).length,
        revenue: customers.filter(c => c.totalSpent > 1000).reduce((sum, c) => sum + c.totalSpent, 0),
        characteristics: ['Alto valor', 'Múltiplas compras', 'Fidelidade alta'],
      },
      {
        segment: 'Regular',
        count: customers.filter(c => c.totalSpent > 200 && c.totalSpent <= 1000).length,
        revenue: customers.filter(c => c.totalSpent > 200 && c.totalSpent <= 1000).reduce((sum, c) => sum + c.totalSpent, 0),
        characteristics: ['Valor médio', 'Compras ocasionais'],
      },
      {
        segment: 'Novo',
        count: customers.filter(c => c.totalPurchases === 1).length,
        revenue: customers.filter(c => c.totalPurchases === 1).reduce((sum, c) => sum + c.totalSpent, 0),
        characteristics: ['Primeira compra', 'Potencial de crescimento'],
      },
    ];
  }

  private getCustomerJourney(sales: any[]): Array<{ stage: string; avgTimeSpent: number; dropoffRate: number }> {
    return [
      { stage: 'Descoberta', avgTimeSpent: 30, dropoffRate: 40 },
      { stage: 'Interesse', avgTimeSpent: 120, dropoffRate: 25 },
      { stage: 'Consideração', avgTimeSpent: 300, dropoffRate: 35 },
      { stage: 'Compra', avgTimeSpent: 180, dropoffRate: 15 },
      { stage: 'Pós-compra', avgTimeSpent: 60, dropoffRate: 10 },
    ];
  }
}

export const analyticsService = new AnalyticsService();
