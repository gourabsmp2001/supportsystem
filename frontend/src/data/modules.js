import {
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  ImagePlus,
  LayoutTemplate,
  Upload,
  CircleHelp,
  MapPinned,
  PackageCheck,
  Percent,
  Store,
  Tags
} from 'lucide-react';

/*
  lookup: 'retailer' | 'brand'
  When a field has a `lookup` property, FormModal renders a SearchableSelect
  instead of a plain text input, fetching options from the corresponding entity table.
*/

export const moduleConfigs = {
  retailers: {
    path: '/retail-list',
    title: 'Retail List',
    shortTitle: 'Retail List',
    icon: Store,
    monthField: null,
    primaryField: 'retail_name',
    isEntityTable: true,
    description: 'Manage retail shops, license details, areas, and active status.',
    fields: [
      { name: 'retail_id', label: 'Retail ID', type: 'text', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true },
      { name: 'license_code', label: 'License Code', type: 'text' },
      { name: 'shop_type', label: 'Shop Type', type: 'select', options: ['Wine Shop', 'Beer Shop', 'Premium Outlet', 'Retail Chain', 'Other'] },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ]
  },
  brands: {
    path: '/brand-master',
    title: 'Brand List',
    shortTitle: 'Brand List',
    icon: Tags,
    monthField: null,
    primaryField: 'brand_name',
    isEntityTable: true,
    description: 'Maintain the active brand list used across sales and availability reports.',
    fields: [
      { name: 'brand_id', label: 'Brand ID', type: 'text', required: true },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Whisky', 'Rum', 'Vodka', 'Gin', 'Beer', 'Wine', 'Brandy', 'Other'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ]
  },
  brand_mrp: {
    path: '/brand-mrp',
    title: 'Brand MRP',
    shortTitle: 'Brand MRP',
    icon: BadgeIndianRupee,
    monthField: 'effective_month',
    primaryField: 'brand_name',
    description: 'Track bottle-size wise MRP and effective month for each brand.',
    fields: [
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'category', label: 'Category', type: 'select', options: ['Whisky', 'Rum', 'Vodka', 'Gin', 'Beer', 'Wine', 'Brandy', 'Other'] },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: ['750ml', '500ml', '375ml', '180ml', '90ml'] },
      { name: 'mrp', label: 'MRP', type: 'number', step: '0.01' },
      { name: 'effective_month', label: 'Effective Month', type: 'month', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ]
  },
  sss_sales_entries: {
    path: '/sss-report',
    title: 'SSS Report / SS Report',
    shortTitle: 'SSS Report',
    icon: FileSpreadsheet,
    monthField: 'month',
    primaryField: 'retail_name',
    description: 'Retail-wise brand sales entry with auto-calculated total cases.',
    fields: [
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'executive_name', label: 'Executive Name', type: 'text' },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: ['750ml', '500ml', '375ml', '180ml', '90ml'] },
      { name: 'quantity_sold', label: 'Quantity Sold', type: 'number', step: '0.01' },
      { name: 'total_cases', label: 'Total Cases', type: 'number', readOnly: true, formula: 'quantity_sold / 12' },
      { name: 'category', label: 'Category', type: 'select', options: ['Whisky', 'Rum', 'Vodka', 'Gin', 'Beer', 'Wine', 'Brandy', 'Other'] },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  },
  availability_entries: {
    path: '/availability-report',
    title: 'Availability Report',
    shortTitle: 'Availability',
    icon: PackageCheck,
    monthField: 'month',
    primaryField: 'retail_name',
    description: 'Capture retail-wise brand availability, depot, and stock status.',
    fields: [
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'executive_name', label: 'Executive Name', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Whisky', 'Rum', 'Vodka', 'Gin', 'Beer', 'Wine', 'Brandy', 'Other'] },
      { name: 'depot', label: 'Depot', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'availability_status', label: 'Availability Status', type: 'select', options: ['Available', 'Not Available', 'Low Stock', 'Not Asked'], defaultValue: 'Not Asked' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  },
  scheme_projections: {
    path: '/scheme-projection',
    title: 'Scheme Projection',
    shortTitle: 'Scheme Projection',
    icon: ClipboardList,
    monthField: 'month',
    primaryField: 'retail_name',
    description: 'Compare target, expected, and actual scheme sales.',
    fields: [
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'scheme_name', label: 'Scheme Name', type: 'text' },
      { name: 'target_quantity', label: 'Target Quantity', type: 'number', step: '0.01' },
      { name: 'expected_sale', label: 'Expected Sale', type: 'number', step: '0.01' },
      { name: 'actual_sale', label: 'Actual Sale', type: 'number', step: '0.01' },
      { name: 'difference', label: 'Difference', type: 'number', readOnly: true, formula: 'actual_sale - expected_sale' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  },
  opening_stock_entries: {
    path: '/opening-stock',
    title: 'Brand Opening Stock',
    shortTitle: 'Opening Stock',
    icon: Boxes,
    monthField: 'month',
    filterField: 'date',
    filterType: 'date',
    primaryField: 'retail_name',
    description: 'Record date-wise opening stock by brand and bottle size.',
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: ['750ml', '500ml', '375ml', '180ml', '90ml'] },
      { name: 'opening_stock_quantity', label: 'Opening Stock Quantity', type: 'number', step: '0.01' },
      { name: 'opening_stock_cases', label: 'Opening Stock Cases', type: 'number', step: '0.01' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  },
  secondary_market_share_entries: {
    path: '/secondary-market-share',
    title: 'Secondary Market Share',
    shortTitle: 'Market Share',
    icon: Percent,
    monthField: 'month',
    primaryField: 'retail_name',
    description: 'Calculate own-brand market share against competitor sales.',
    fields: [
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'own_brand_name', label: 'Own Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'own_brand_sale', label: 'Own Brand Sale', type: 'number', step: '0.01' },
      { name: 'competitor_brand_name', label: 'Competitor Brand Name', type: 'text' },
      { name: 'competitor_sale', label: 'Competitor Sale', type: 'number', step: '0.01' },
      { name: 'total_market_sale', label: 'Total Market Sale', type: 'number', step: '0.01' },
      { name: 'market_share_percentage', label: 'Market Share %', type: 'number', readOnly: true, formula: 'own_brand_sale / total_market_sale * 100' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  },
  spot_promotion_entries: {
    path: '/spot-promotion-sale',
    title: 'Spot Promotion Sale',
    shortTitle: 'Spot Promotion',
    icon: BarChart3,
    monthField: 'month',
    primaryField: 'promoter_name',
    description: 'Promoter payment, working days, and daily sales reporting.',
    fields: [
      { name: 'promoter_name', label: 'Promoter Name', type: 'text', required: true },
      { name: 'bank_name', label: 'Bank Name', type: 'text' },
      { name: 'branch', label: 'Branch', type: 'text' },
      { name: 'account_number', label: 'Account Number', type: 'text' },
      { name: 'ifsc', label: 'IFSC', type: 'text' },
      { name: 'pan', label: 'PAN', type: 'text' },
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'total_month_days', label: 'Total Month Days', type: 'number', step: '0.01' },
      { name: 'leave_days', label: 'Leave Days', type: 'number', step: '0.01' },
      { name: 'actual_working_days', label: 'Actual Working Days', type: 'number', readOnly: true },
      { name: 'daily_rate', label: 'Daily Rate', type: 'number', step: '0.01' },
      { name: 'total_payable_amount', label: 'Total Payable Amount', type: 'number', readOnly: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true, lookup: 'brand' },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: ['750ml', '500ml', '375ml', '180ml', '90ml'] },
      { name: 'quantity_sold', label: 'Quantity Sold', type: 'number', step: '0.01' },
      { name: 'total_cases', label: 'Total Cases', type: 'number', readOnly: true }
    ]
  },
  retail_visit_entries: {
    path: '/retail-visits',
    title: 'Retail Visit with Photos',
    shortTitle: 'Retail Visits',
    icon: ImagePlus,
    monthField: 'visit_month',
    filterField: 'visit_date',
    filterType: 'date',
    primaryField: 'retail_name',
    description: 'Log visit notes, next follow-up, status, and shop photos.',
    fields: [
      { name: 'visit_date', label: 'Visit Date', type: 'date', required: true },
      { name: 'retail_name', label: 'Retail / Shop Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', lookup: 'brand' },
      { name: 'executive_name', label: 'Executive Name', type: 'text' },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'visit_purpose', label: 'Visit Purpose', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
      { name: 'photo_url', label: 'Photo URL', type: 'photo', wide: true },
      { name: 'next_follow_up_date', label: 'Next Follow-up Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Completed', 'Pending', 'Follow-up Required'], defaultValue: 'Pending' }
    ]
  },
  pjp_entries: {
    path: '/pjp',
    title: 'PJP / Planned Journey Plan',
    shortTitle: 'PJP',
    icon: MapPinned,
    monthField: 'month',
    filterField: 'date',
    filterType: 'date',
    primaryField: 'planned_retail_name',
    description: 'Plan and track daily retail visits.',
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'month', label: 'Month', type: 'month', required: true },
      { name: 'executive_name', label: 'Executive Name', type: 'text' },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'planned_retail_name', label: 'Planned Retail Name', type: 'text', required: true, lookup: 'retailer' },
      { name: 'brand_name', label: 'Brand Name', type: 'text', lookup: 'brand' },
      { name: 'visit_status', label: 'Visit Status', type: 'select', options: ['Planned', 'Visited', 'Missed'], defaultValue: 'Planned' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true }
    ]
  }
};

export const navModules = Object.entries(moduleConfigs).map(([key, config]) => ({ key, ...config }));

export const quickModules = navModules.filter((module) => module.key !== 'brands');

export const utilityPages = [
  { path: '/import-data', title: 'Import Data', shortTitle: 'Import Data', icon: Upload },
  { path: '/report-templates', title: 'Report Templates', shortTitle: 'Report Templates', icon: LayoutTemplate },
  { path: '/help', title: 'Help / Usage Guide', shortTitle: 'Help', icon: CircleHelp }
];
