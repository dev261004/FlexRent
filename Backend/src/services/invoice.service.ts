import { AppError } from "../middleware/error.middleware";
import { rentalOrderRepository, RentalOrderRecord } from "../repositories/rental-order.repository";
import { ProductRequester } from "../types/product.types";

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  issueDate: string;
  rentalStart: string;
  rentalEnd: string;
  durationInDays: number;
  fulfillmentMethod: string;
  deliveryAddress: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  pickupLocation: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  vendor: {
    id: string;
    name: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    gstNumber: string | null;
    upiId: string | null;
  };
  customer: {
    id: string;
    name: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    gstNumber: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    rentalPrice: string;
    deposit: string;
    subtotal: string;
  }>;
  financials: {
    subtotal: string;
    securityDepositAmount: string;
    lateFee: string;
    grandTotal: string;
    totalPaid: string;
    outstandingBalance: string;
  };
  payments: Array<{
    id: string;
    amount: string;
    method: string;
    status: string;
    transactionId: string | null;
    paidAt: string | null;
    verifiedAt: string | null;
  }>;
  securityDeposit: {
    amount: string;
    collectedAmount: string;
    deductedAmount: string;
    refundedAmount: string;
    status: string;
    collectedAt: string | null;
    refundedAt: string | null;
  } | null;
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
};

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num || 0);
};

export class InvoiceService {
  async getInvoiceData(orderId: string, user: ProductRequester): Promise<InvoiceData> {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    if (!order) {
      throw new AppError(404, "Rental order not found");
    }

    if (user.role === "CUSTOMER" && order.customerId !== user.id) {
      throw new AppError(403, "You can only view invoices for your own orders");
    }
    if (user.role === "VENDOR" && order.vendorId !== user.id) {
      throw new AppError(403, "You can only view invoices for orders assigned to you");
    }

    const start = new Date(order.rentalStart);
    const end = new Date(order.rentalEnd);
    const diffHours = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const durationInDays = Math.ceil(diffHours / 24);

    const paidPayments = order.payments.filter((p: any) => p.status === "PAID");
    const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0);
    const grandTotal = toNumber(order.grandTotal);
    const outstandingBalance = Math.max(0, grandTotal - totalPaid);

    const vendorDisplayName = order.vendor.companyName ||
      [order.vendor.firstName, order.vendor.lastName].filter(Boolean).join(" ") ||
      order.vendor.email;

    const customerDisplayName = order.customer.companyName ||
      [order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") ||
      order.customer.email;

    const invoiceNumber = `INV-${order.rentalNumber.replace(/^RO-/, "")}`;

    return {
      invoiceNumber,
      orderNumber: order.rentalNumber,
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      issueDate: (order.approvedAt || order.createdAt).toISOString(),
      rentalStart: order.rentalStart.toISOString(),
      rentalEnd: order.rentalEnd.toISOString(),
      durationInDays,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddress: order.deliveryAddressLine1
        ? {
            addressLine1: order.deliveryAddressLine1,
            addressLine2: order.deliveryAddressLine2,
            city: order.deliveryCity,
            state: order.deliveryState,
            postalCode: order.deliveryPostalCode,
            country: order.deliveryCountry,
          }
        : null,
      pickupLocation: order.pickupAddressLine1
        ? {
            addressLine1: order.pickupAddressLine1,
            addressLine2: order.pickupAddressLine2,
            city: order.pickupCity,
            state: order.pickupState,
            postalCode: order.pickupPostalCode,
            country: order.pickupCountry,
          }
        : null,
      vendor: {
        id: order.vendor.id,
        name: vendorDisplayName,
        companyName: order.vendor.companyName ?? null,
        email: order.vendor.email,
        phone: order.vendor.phone ?? null,
        gstNumber: order.vendor.gstNumber ?? null,
        upiId: order.vendor.upiId ?? null,
      },
      customer: {
        id: order.customer.id,
        name: customerDisplayName,
        companyName: order.customer.companyName ?? null,
        email: order.customer.email,
        phone: order.customer.phone ?? null,
        gstNumber: order.customer.gstNumber ?? null,
      },
      items: order.items.map((item: any) => ({
        id: item.id,
        name: item.product?.name || "Rental Item",
        sku: item.variant?.sku || item.product?.sku || null,
        quantity: item.quantity,
        rentalPrice: toNumber(item.rentalPrice).toFixed(2),
        deposit: toNumber(item.deposit).toFixed(2),
        subtotal: toNumber(item.subtotal).toFixed(2),
      })),
      financials: {
        subtotal: toNumber(order.subtotal).toFixed(2),
        securityDepositAmount: toNumber(order.securityDepositAmount).toFixed(2),
        lateFee: toNumber(order.lateFee).toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        outstandingBalance: outstandingBalance.toFixed(2),
      },
      payments: order.payments.map((p: any) => ({
        id: p.id,
        amount: toNumber(p.amount).toFixed(2),
        method: p.method,
        status: p.status,
        transactionId: p.transactionId,
        paidAt: p.paidAt?.toISOString() ?? null,
        verifiedAt: p.verifiedAt?.toISOString() ?? null,
      })),
      securityDeposit: order.securityDeposit
        ? {
            amount: toNumber(order.securityDeposit.amount).toFixed(2),
            collectedAmount:
              order.securityDeposit.status === "COLLECTED" ||
              order.securityDeposit.status === "REFUNDED" ||
              order.securityDeposit.status === "PARTIALLY_REFUNDED" ||
              order.securityDeposit.status === "DEDUCTED"
                ? toNumber(order.securityDeposit.amount).toFixed(2)
                : "0.00",
            deductedAmount: toNumber(order.securityDeposit.deductedAmount).toFixed(2),
            refundedAmount: toNumber(order.securityDeposit.refundedAmount).toFixed(2),
            status: order.securityDeposit.status,
            collectedAt: order.securityDeposit.collectedAt?.toISOString() ?? null,
            refundedAt: order.securityDeposit.refundedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  generateInvoiceHtml(invoice: InvoiceData, autoPrint = false): string {
    const formattedIssueDate = new Date(invoice.issueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedStartDate = new Date(invoice.rentalStart).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedEndDate = new Date(invoice.rentalEnd).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const deliveryAddressStr = invoice.deliveryAddress
      ? [
          invoice.deliveryAddress.addressLine1,
          invoice.deliveryAddress.addressLine2,
          invoice.deliveryAddress.city,
          invoice.deliveryAddress.state,
          invoice.deliveryAddress.postalCode,
          invoice.deliveryAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "Not specified";

    const pickupAddressStr = invoice.pickupLocation
      ? [
          invoice.pickupLocation.addressLine1,
          invoice.pickupLocation.addressLine2,
          invoice.pickupLocation.city,
          invoice.pickupLocation.state,
          invoice.pickupLocation.postalCode,
          invoice.pickupLocation.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "Store Pickup / Vendor Address";

    const itemsRows = invoice.items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
            ${item.name}
            ${item.sku ? `<div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">SKU: ${item.sku}</div>` : ""}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155;">${item.quantity}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatCurrency(item.rentalPrice)}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatCurrency(item.deposit)}</td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `
      )
      .join("");

    const paymentRows = invoice.payments
      .map(
        (p) => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px dashed #e2e8f0;">
          <span><strong>${p.method}</strong> ${p.transactionId ? `(UTR: ${p.transactionId})` : ""}</span>
          <span><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${p.status === "PAID" ? "#dcfce7; color: #15803d;" : "#fef3c7; color: #b45309;"}">${p.status}</span> ${formatCurrency(p.amount)}</span>
        </div>
      `
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; padding: 32px 16px; font-size: 13px; line-height: 1.5; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); padding: 40px; border: 1px solid #e2e8f0; }
    .btn-print { background: #0f172a; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; transition: opacity 0.2s; }
    .btn-print:hover { opacity: 0.9; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-container { box-shadow: none; border: none; padding: 0; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center;">
    <a href="javascript:window.history.back()" style="color: #64748b; text-decoration: none; font-size: 13px; font-weight: 500;">&larr; Back to Order</a>
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"></path></svg>
      Print / Save as PDF
    </button>
  </div>

  <div class="invoice-container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 28px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 36px; height: 36px; background: #fbbf24; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: #1e1b4b;">F</div>
          <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">FlexRent</span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 6px;">Equipment & Machinery Rental Management Platform</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Tax Invoice</h1>
        <p style="font-family: monospace; font-weight: 700; color: #4338ca; font-size: 14px; margin-top: 4px;">${invoice.invoiceNumber}</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${formattedIssueDate}</p>
        <div style="margin-top: 6px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${invoice.paymentStatus === "PAID" ? "#dcfce7; color: #15803d;" : "#fef3c7; color: #b45309;"}">${invoice.paymentStatus}</span>
        </div>
      </div>
    </div>

    <!-- Parties Metadata -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
      <div>
        <h3 style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Billed By (Vendor)</h3>
        <p style="font-size: 15px; font-weight: 700; color: #0f172a;">${invoice.vendor.name}</p>
        ${invoice.vendor.companyName && invoice.vendor.companyName !== invoice.vendor.name ? `<p style="color: #475569;">${invoice.vendor.companyName}</p>` : ""}
        ${invoice.vendor.gstNumber ? `<p style="color: #475569; font-size: 12px; margin-top: 2px;"><strong>GSTIN:</strong> ${invoice.vendor.gstNumber}</p>` : ""}
        <p style="color: #475569; font-size: 12px;">Email: ${invoice.vendor.email}</p>
        ${invoice.vendor.phone ? `<p style="color: #475569; font-size: 12px;">Phone: ${invoice.vendor.phone}</p>` : ""}
        ${invoice.vendor.upiId ? `<p style="color: #475569; font-size: 12px;">UPI ID: ${invoice.vendor.upiId}</p>` : ""}
      </div>
      <div>
        <h3 style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Billed To (Customer)</h3>
        <p style="font-size: 15px; font-weight: 700; color: #0f172a;">${invoice.customer.name}</p>
        ${invoice.customer.companyName ? `<p style="color: #475569;">${invoice.customer.companyName}</p>` : ""}
        ${invoice.customer.gstNumber ? `<p style="color: #475569; font-size: 12px; margin-top: 2px;"><strong>GSTIN:</strong> ${invoice.customer.gstNumber}</p>` : ""}
        <p style="color: #475569; font-size: 12px;">Email: ${invoice.customer.email}</p>
        ${invoice.customer.phone ? `<p style="color: #475569; font-size: 12px;">Phone: ${invoice.customer.phone}</p>` : ""}
        <p style="color: #475569; font-size: 12px; margin-top: 4px;"><strong>Address:</strong> ${deliveryAddressStr}</p>
      </div>
    </div>

    <!-- Rental Period & Logistics -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 14px 20px; margin: 24px 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; border: 1px solid #e2e8f0;">
      <div>
        <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Rental Period</span>
        <p style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">${formattedStartDate} &rarr; ${formattedEndDate}</p>
        <span style="font-size: 11px; color: #4338ca; font-weight: 600;">(${invoice.durationInDays} Day${invoice.durationInDays > 1 ? "s" : ""})</span>
      </div>
      <div>
        <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Fulfillment</span>
        <p style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">${invoice.fulfillmentMethod === "STORE_PICKUP" ? "Store Pickup" : "Home Delivery"}</p>
      </div>
      <div>
        <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Rental Order Reference</span>
        <p style="font-family: monospace; font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">#${invoice.orderNumber}</p>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 10px 14px; border-radius: 8px 0 0 0; text-align: center;">#</th>
          <th style="padding: 10px 14px;">Item Description</th>
          <th style="padding: 10px 14px; text-align: center;">Qty</th>
          <th style="padding: 10px 14px; text-align: right;">Rental Rate</th>
          <th style="padding: 10px 14px; text-align: right;">Deposit</th>
          <th style="padding: 10px 14px; border-radius: 0 8px 0 0; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals and Payment Breakdown -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; margin-top: 28px;">
      <!-- Payments and Security Deposit Info -->
      <div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <h4 style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">Payment Details</h4>
          ${invoice.payments.length > 0 ? paymentRows : `<p style="font-size: 12px; color: #64748b;">No payment records available.</p>`}
          
          ${
            invoice.securityDeposit && Number(invoice.securityDeposit.amount) > 0
              ? `
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <h5 style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Security Deposit Status: <span style="color: #4338ca;">${invoice.securityDeposit.status}</span></h5>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-top: 4px;">
                <span>Total Held: ${formatCurrency(invoice.securityDeposit.amount)}</span>
                ${Number(invoice.securityDeposit.refundedAmount) > 0 ? `<span style="color: #15803d;">Refunded: ${formatCurrency(invoice.securityDeposit.refundedAmount)}</span>` : ""}
                ${Number(invoice.securityDeposit.deductedAmount) > 0 ? `<span style="color: #b91c1c;">Deducted: ${formatCurrency(invoice.securityDeposit.deductedAmount)}</span>` : ""}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Financial Calculation Summary -->
      <div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569;">
            <span>Rental Subtotal</span>
            <span style="font-weight: 600; color: #0f172a;">${formatCurrency(invoice.financials.subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569;">
            <span>Security Deposit</span>
            <span style="font-weight: 600; color: #0f172a;">${formatCurrency(invoice.financials.securityDepositAmount)}</span>
          </div>
          ${
            Number(invoice.financials.lateFee) > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #dc2626;">
              <span>Late Fee</span>
              <span style="font-weight: 600;">${formatCurrency(invoice.financials.lateFee)}</span>
            </div>
          `
              : ""
          }
          <div style="border-top: 2px solid #0f172a; margin: 10px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0f172a;">
            <span>Grand Total</span>
            <span>${formatCurrency(invoice.financials.grandTotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #15803d;">
            <span>Total Paid</span>
            <span style="font-weight: 700;">${formatCurrency(invoice.financials.totalPaid)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569;">
            <span>Balance Due</span>
            <span style="font-weight: 700; color: ${Number(invoice.financials.outstandingBalance) > 0 ? "#b91c1c" : "#15803d"};">${formatCurrency(invoice.financials.outstandingBalance)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms & Footer -->
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #94a3b8;">
      <div>
        <p style="font-weight: 600; color: #64748b; margin-bottom: 2px;">Terms & Conditions</p>
        <p>1. Security deposit is refundable post equipment return and condition inspection.</p>
        <p>2. Equipment must be returned on or before the agreed rental period to avoid late return penalty.</p>
        <p>3. This is a computer-generated invoice and does not require physical signature.</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #64748b; font-weight: 600;">FlexRent Platform Services</p>
        <p>support@flexrent.com | www.flexrent.com</p>
      </div>
    </div>
  </div>

  ${autoPrint ? `<script>window.onload = function() { window.print(); }</script>` : ""}
</body>
</html>`;
  }
}

export const invoiceService = new InvoiceService();
