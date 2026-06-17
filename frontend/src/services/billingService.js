import api from './api';

const unwrap = (r) => ({ data: r.data?.data ?? r.data });

export const billingService = {
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`).then(unwrap),
  getInvoiceByVisitId: (visitId) => api.get(`/billing/invoices/visit/${visitId}`).then(unwrap),
  getPaymentsByInvoiceId: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`).then(unwrap),
  getAllPayments: () => api.get('/payments/admin/all').then(unwrap),
  deletePayment: (id) => api.delete(`/payments/${id}`).then(unwrap),
};
