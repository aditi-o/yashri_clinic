import { useEffect, useMemo, useState } from 'react';
import { billingService } from '../../services/billingService';
import { EmptyState, PageLoader, SectionHeader, StatusBadge } from '../../components/ui';

const fmtINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const unwrapList = (response) => {
    const payload = response?.data?.data ?? response?.data ?? [];
    return Array.isArray(payload) ? payload : [];
};

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [query, setQuery] = useState('');

    const loadPayments = async () => {
        setLoading(true);
        try {
            const response = await billingService.getAllPayments();
            setPayments(unwrapList(response));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to load payments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const filteredPayments = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return payments;

        return payments.filter((payment) => {
            const patientName = `${payment.invoice?.patient?.firstName || ''} ${payment.invoice?.patient?.lastName || ''}`.toLowerCase();
            const invoiceNumber = (payment.invoice?.invoiceNumber || '').toLowerCase();
            const transactionId = (payment.transactionId || '').toLowerCase();
            const method = (payment.paymentMethod || '').toLowerCase();

            return patientName.includes(q) || invoiceNumber.includes(q) || transactionId.includes(q) || method.includes(q);
        });
    }, [payments, query]);

    const handleDelete = async (payment) => {
        const patientName = `${payment.invoice?.patient?.firstName || ''} ${payment.invoice?.patient?.lastName || ''}`.trim() || 'this payment';
        const ok = window.confirm(
            `Delete payment ${payment.transactionId || payment.id} for ${patientName}? This will recalculate the invoice status.`
        );

        if (!ok) return;

        setDeletingId(payment.id);
        try {
            await billingService.deletePayment(payment.id);
            setPayments((current) => current.filter((item) => item.id !== payment.id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete payment.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <PageLoader label="Loading payments…" />;

    return (
        <div className="space-y-6 anim-up">
            <div className="ph">
                <div>
                    <h1 className="ph-title">Payments</h1>
                    <p className="ph-sub">Admin-only transaction records and deletions</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search patient, invoice, transaction…"
                        className="inp"
                        style={{ maxWidth: 320 }}
                    />
                    <button onClick={loadPayments} className="btn btn-sm" style={{ background: 'var(--surface-2)' }}>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,.08), rgba(59,130,246,.06))' }}>
                <SectionHeader title="How to navigate" action={<span className="badge badge-green">Admin</span>} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Open the admin sidebar, click Payments, then use the table to review invoice-linked transaction records.
                    The Delete action removes a payment and immediately updates the invoice total and status on the backend.
                </p>
            </div>

            <div className="tbl-wrap">
                <table className="tbl">
                    <thead>
                        <tr>
                            <th>Payment</th>
                            <th>Patient</th>
                            <th>Invoice</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!filteredPayments.length ? (
                            <tr>
                                <td colSpan={8}>
                                    <EmptyState icon="💳" title="No payments found" sub="Try a different search term or refresh the list." />
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <div>
                                            <p className="font-semibold text-sm">{payment.transactionId || payment.id.slice(0, 8)}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-light)' }}>{payment.id}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {payment.invoice?.patient?.firstName} {payment.invoice?.patient?.lastName}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Patient record</p>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{payment.invoice?.invoiceNumber || '—'}</td>
                                    <td className="font-semibold">{fmtINR(payment.amount)}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{payment.paymentMethod}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {payment.paymentDate
                                            ? new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : '—'}
                                    </td>
                                    <td>
                                        <StatusBadge status={payment.invoice?.status || 'UNPAID'} />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(payment)}
                                            disabled={deletingId === payment.id}
                                            className="btn btn-sm"
                                            style={{ background: 'var(--danger-light)', color: '#991b1b', border: '1px solid #fca5a5' }}
                                        >
                                            {deletingId === payment.id ? 'Deleting…' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
