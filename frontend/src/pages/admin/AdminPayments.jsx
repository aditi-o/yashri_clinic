import { useEffect, useMemo, useRef, useState } from 'react';
import { billingService } from '../../services/billingService';
import { EmptyState, PageLoader, SectionHeader, StatusBadge, StatCard } from '../../components/ui';

const fmtINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const unwrapList = (response) => {
    const payload = response?.data ?? [];
    return Array.isArray(payload) ? payload : [];
};

const EMPTY_STATS = {
    paymentsCollected: 0,
    todayPaymentsCollected: 0,
    paymentTransactions: 0,
    todayPaymentTransactions: 0,
    visitRevenue: 0,
    todayVisitRevenue: 0,
    totalVisits: 0,
    todayVisits: 0,
    totalInvoices: 0,
    unpaidInvoices: 0,
    paidInvoices: 0,
    visitsPendingBilling: 0,
};

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [query, setQuery] = useState('');
    const syncStartedRef = useRef(false);

    const loadPayments = async ({ autoSync = false } = {}) => {
        setLoading(true);
        try {
            let statsRes = await billingService.getPaymentStats();
            let statsData = statsRes?.data ?? EMPTY_STATS;

            if (autoSync && statsData.visitsPendingBilling > 0 && !syncStartedRef.current) {
                syncStartedRef.current = true;
                try {
                    await billingService.syncBillingFromVisits();
                } catch (error) {
                    const partial = error.response?.data?.data;
                    if (!partial?.paymentsCreated && !partial?.invoicesCreated) {
                        console.error('Billing sync failed:', error.response?.data?.message || error.message);
                    }
                }
                statsRes = await billingService.getPaymentStats();
                statsData = statsRes?.data ?? EMPTY_STATS;
            }

            const paymentsRes = await billingService.getAllPayments();
            setPayments(unwrapList(paymentsRes));
            setStats(statsData);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to load payments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments({ autoSync: true });
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

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await billingService.syncBillingFromVisits();
            const sync = result?.data ?? {};
            alert(`Synced ${sync.invoicesCreated ?? 0} invoice(s) and ${sync.paymentsCreated ?? 0} payment(s) from visits.`);
            await loadPayments();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to sync billing from visits.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (payment) => {
        const patientName = `${payment.invoice?.patient?.firstName || ''} ${payment.invoice?.patient?.lastName || ''}`.trim() || 'this payment';
        const ok = window.confirm(
            `Delete payment ${payment.transactionId || payment.id} for ${patientName}? This will recalculate the invoice status.`
        );

        if (!ok) return;

        setDeletingId(payment.id);
        try {
            await billingService.deletePayment(payment.id);
            await loadPayments();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete payment.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <PageLoader label="Loading payments…" />;

    const needsSync = stats.visitsPendingBilling > 0 || (stats.visitRevenue > 0 && stats.paymentTransactions === 0);

    return (
        <div className="space-y-6 anim-up">
            <div className="ph">
                <div>
                    <h1 className="ph-title">Payments</h1>
                    <p className="ph-sub">Visit revenue, collected payments, and transaction records</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search patient, invoice, transaction…"
                        className="inp"
                        style={{ maxWidth: 320 }}
                    />
                    {needsSync && (
                        <button onClick={handleSync} disabled={syncing} className="btn btn-primary btn-sm">
                            {syncing ? 'Syncing…' : `Sync ${stats.visitsPendingBilling || ''} visit(s)`}
                        </button>
                    )}
                    <button onClick={loadPayments} className="btn btn-sm" style={{ background: 'var(--surface-2)' }}>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon="🏥" label="Total Visit Revenue" value={fmtINR(stats.visitRevenue)} accent="#7c3aed" bg="#ede9fe" />
                <StatCard icon="📅" label="Today's Visit Revenue" value={fmtINR(stats.todayVisitRevenue)} accent="#3b82f6" bg="#eff6ff" />
                <StatCard icon="💰" label="Payments Collected" value={fmtINR(stats.paymentsCollected)} accent="#14b8a6" bg="#ccfbf1" />
                <StatCard icon="💳" label="Payment Transactions" value={stats.paymentTransactions} accent="#f59e0b" bg="#fef3c7" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon="🗓️" label="Today's Collections" value={fmtINR(stats.todayPaymentsCollected)} accent="#10b981" bg="#d1fae5" />
                <StatCard icon="📋" label="Total Invoices" value={stats.totalInvoices} accent="#6366f1" bg="#eef2ff" />
                <StatCard icon="✅" label="Paid Invoices" value={stats.paidInvoices} accent="#14b8a6" bg="#ccfbf1" />
                <StatCard icon="⏳" label="Unpaid Invoices" value={stats.unpaidInvoices} accent="#ef4444" bg="#fee2e2" />
            </div>

            {needsSync && (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,.1), rgba(251,191,36,.06))', border: '1px solid #fcd34d' }}>
                    <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                        {stats.visitsPendingBilling > 0
                            ? `${stats.visitsPendingBilling} visit(s) with fees are not yet linked to payment records.`
                            : 'Visit revenue exists but no payment transactions are recorded yet.'}
                        {' '}Click <strong>Sync visit(s)</strong> to create invoices and payment records from your existing visit data.
                    </p>
                </div>
            )}

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,.08), rgba(59,130,246,.06))' }}>
                <SectionHeader title="How billing works" action={<span className="badge badge-green">Admin</span>} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Visit revenue comes from consultation fees recorded during doctor visits.
                    Payment transactions are created when fees are collected — new visits with a fee are billed automatically.
                    Use Sync to backfill older visits that were created before billing was enabled.
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
                                    <EmptyState
                                        icon="💳"
                                        title="No payment transactions yet"
                                        sub={stats.visitRevenue > 0
                                            ? 'Visit revenue is recorded — click Sync visit(s) to generate payment records.'
                                            : 'Payments appear here after visits with consultation fees are completed.'}
                                    />
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
