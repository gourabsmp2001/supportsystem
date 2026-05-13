const n = (value) => Number(value || 0);

function totalBottles(values, prefix) {
  return n(values[`${prefix}_750ml`]) + n(values[`${prefix}_500ml`]) + n(values[`${prefix}_375ml`]) + n(values[`${prefix}_180ml`]) + n(values[`${prefix}_90ml`]);
}

function totalCases(values, prefix) {
  return Number((
    n(values[`${prefix}_750ml`]) / 12 +
    n(values[`${prefix}_500ml`]) / 24 +
    n(values[`${prefix}_375ml`]) / 24 +
    n(values[`${prefix}_180ml`]) / 48 +
    n(values[`${prefix}_90ml`]) / 96
  ).toFixed(2));
}

export function calculateRecord(moduleKey, values) {
  const next = { ...values };

  if (moduleKey === 'sss_sales_entries' || moduleKey === 'spot_promotion_entries') {
    const hasSizeFields = ['qty_750ml', 'qty_500ml', 'qty_375ml', 'qty_180ml', 'qty_90ml'].some((field) => field in next);
    if (hasSizeFields) {
      next.total_bottles = Number(totalBottles(next, 'qty').toFixed(2));
      next.total_cases = totalCases(next, 'qty');
      next.quantity_sold = next.total_bottles;
    } else {
      next.total_cases = Number((n(next.quantity_sold) / 12).toFixed(2));
    }
  }

  if (moduleKey === 'opening_stock_entries') {
    const hasStockFields = ['stock_750ml', 'stock_500ml', 'stock_375ml', 'stock_180ml', 'stock_90ml'].some((field) => field in next);
    if (hasStockFields) {
      next.total_stock_bottles = Number(totalBottles(next, 'stock').toFixed(2));
      next.total_stock_cases = totalCases(next, 'stock');
      next.opening_stock_quantity = next.total_stock_bottles;
      next.opening_stock_cases = next.total_stock_cases;
    }
  }

  if (moduleKey === 'scheme_projections') {
    next.difference = Number((n(next.actual_sale) - n(next.expected_sale)).toFixed(2));
  }

  if (moduleKey === 'secondary_market_share_entries') {
    next.market_share_percentage = n(next.total_market_sale)
      ? Number(((n(next.own_brand_sale) / n(next.total_market_sale)) * 100).toFixed(2))
      : 0;
  }

  if (moduleKey === 'spot_promotion_entries') {
    next.actual_working_days = n(next.total_month_days) - n(next.leave_days);
    next.total_payable_amount = Number((next.actual_working_days * n(next.daily_rate)).toFixed(2));
  }

  if (moduleKey === 'retail_visit_entries' && next.visit_date) {
    next.visit_month = next.visit_date.slice(0, 7);
  }

  if (moduleKey === 'pjp_entries' && next.date) {
    next.month = next.month || next.date.slice(0, 7);
  }

  return next;
}
