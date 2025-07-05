export type MetricType = 'revenue' | 'orders' | 'customers' | 'conversion' | 'traffic' | 'performance';
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
export type DataGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface MetricValue {
  value: number;
  previousValue?: number;
  changePercent?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  timestamp: Date;
  label?: string;
  target?: number;
}

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  description: string;
  current: MetricValue;
  historical: DataPoint[];
  unit: string;
  format: 'currency' | 'number' | 'percentage' | 'duration';
  isPositiveGood: boolean;
  thresholds?: {
    good: number;
    warning: number;
    critical: number;
  };
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartData {
  id: string;
  title: string;
  type: ChartType;
  data: DataPoint[];
  categories?: string[];
  series?: ChartSeries[];
  config?: ChartConfig;
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
  type?: ChartType;
}

export interface ChartConfig {
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  responsive?: boolean;
  animations?: boolean;
  colors?: string[];
  xAxis?: {
    show?: boolean;
    label?: string;
    format?: string;
  };
  yAxis?: {
    show?: boolean;
    label?: string;
    format?: string;
    min?: number;
    max?: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: Widget[];
  filters: DashboardFilter[];
  timeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  data?: any;
  lastUpdated?: Date;
}

export type WidgetType =
  | 'metric_card'
  | 'chart'
  | 'table'
  | 'kpi_grid'
  | 'progress_bar'
  | 'gauge'
  | 'heatmap'
  | 'funnel'
  | 'map'
  | 'text'
  | 'image';

export interface WidgetConfig {
  metric?: string;
  chartType?: ChartType;
  dataSource?: string;
  filters?: Record<string, any>;
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: number;
  };
  options?: Record<string, any>;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
  values?: string[];
  defaultValue?: any;
  required?: boolean;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'comparison' | 'trend';
  timeRange: TimeRange;
  metrics: string[];
  data: ReportData;
  insights: Insight[];
  generatedAt: Date;
  userId: string;
}

export interface ReportData {
  summary: Record<string, MetricValue>;
  charts: ChartData[];
  tables: TableData[];
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'percentage' | 'status';
  sortable?: boolean;
  width?: string;
}

export interface TableRow {
  id: string;
  data: Record<string, any>;
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  recommendations?: string[];
  relatedMetrics: string[];
  timestamp: Date;
}

export interface PerformanceMetrics {
  // Revenue metrics
  totalRevenue: MetricValue;
  averageOrderValue: MetricValue;
  revenueGrowthRate: MetricValue;
  monthlyRecurringRevenue: MetricValue;

  // Sales metrics
  totalOrders: MetricValue;
  conversionRate: MetricValue;
  orderFulfillmentTime: MetricValue;
  refundRate: MetricValue;

  // Customer metrics
  totalCustomers: MetricValue;
  newCustomers: MetricValue;
  customerRetentionRate: MetricValue;
  customerLifetimeValue: MetricValue;

  // Product metrics
  topSellingProducts: DataPoint[];
  inventoryTurnover: MetricValue;
  stockoutRate: MetricValue;

  // Payment metrics
  paymentSuccessRate: MetricValue;
  averagePaymentTime: MetricValue;
  pixUsageRate: MetricValue;

  // System metrics
  systemUptime: MetricValue;
  averageResponseTime: MetricValue;
  errorRate: MetricValue;
}

export interface SalesAnalytics {
  totalSales: number;
  salesGrowth: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByPeriod: DataPoint[];
  salesByRegion: DataPoint[];
  salesByPaymentMethod: DataPoint[];
  conversionFunnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerGrowthRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  churnRate: number;
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
    characteristics: string[];
  }>;
  customerJourney: Array<{
    stage: string;
    avgTimeSpent: number;
    dropoffRate: number;
  }>;
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  granularity: DataGranularity;
  categories?: string[];
  regions?: string[];
  paymentMethods?: string[];
  customerSegments?: string[];
  products?: string[];
}

export interface AnalyticsState {
  isLoading: boolean;
  timeRange: TimeRange;
  filters: AnalyticsFilters;
  metrics: PerformanceMetrics | null;
  salesAnalytics: SalesAnalytics | null;
  customerAnalytics: CustomerAnalytics | null;
  dashboards: Dashboard[];
  reports: AnalyticsReport[];
  insights: Insight[];
  lastUpdated?: Date;
}
