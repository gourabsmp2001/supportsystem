const n = (value) => Number(value || 0);

export function calculateRecord(moduleKey, values) {
  const next = { ...values };

  if (moduleKey === 'sss_sales_entries' || moduleKey === 'spot_promotion_entries') {
    next.total_cases = Number((n(next.quantity_sold) / 12).toFixed(2));
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
