export const getBillHTML = (bill) => {
  const date = new Date(bill.date).toLocaleDateString('en-CA');

  return `
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill ${bill.billId}</title>

      <style>
        @media print {
          @page { size: 80mm auto; margin: 0; }
        }

        body { 
          font-family: Arial, sans-serif;
          width: 280px;
          margin: 0 auto;
          padding: 10px;
          font-size: 14px;
          color: #000;
        }

        .header {
          text-align: center;
          line-height: 1.2;
        }

        .header h2 {
          font-size: 20px;
          margin: 3px 0;
          font-weight: bold;
        }

        .header p {
          margin: 2px 0;
          font-size: 14px;
        }

        .bill-info {
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.5;
        }

        .separator {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          font-size: 14px;
        }

        td {
          padding: 3px 0;
          vertical-align: top;
        }

        .qty, .price, .total {
          text-align: right;
          white-space: nowrap;
        }

        .name {
          width: 45%;
        }

        .qty { width: 15%; }
        .price { width: 20%; }
        .total { width: 20%; }

        .totals {
          font-size: 14px;
          line-height: 1.7;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
        }

        .sinhala-note {
          font-size: 16px;
          text-align: center;
          margin: 10px 0;
          line-height: 1.4;
          font-weight: bold;
        }

        .footer {
          text-align: center;
          font-weight: bold;
          margin-top: 8px;
          font-size: 15px;
        }
      </style>
    </head>

    <body>

      <div class="header">
        <h2>Jagath Store</h2>
        <p>Pasal Mawatha, Okkampitiya</p>
        <p>Tel: 071 6937755</p>
      </div>

      <div class="bill-info">
        <div><b>Bill ID:</b> ${bill.billId}</div>
        <div>${date.replace(/-/g, '.')} | ${bill.time}</div>
        ${bill.customerId ? `
          <div><b>Customer:</b> ${bill.customerName}</div>
          <div><b>*** CREDIT BILL - NOT PAID ***</b></div>
        ` : ''}
      </div>

      <div class="separator"></div>

      <table>
        <thead>
          <tr>
            <th class="name">Item</th>
            <th class="qty">Qty</th>
            <th class="price">Price</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(i => `
            <tr>
              <td class="name">${i.name}</td>
              <td class="qty">${i.quantity}</td>
              <td class="price">${i.price}</td>
              <td class="total">${i.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="separator"></div>

      <div class="totals">
        <div class="totals-row">
          <span><b>Sub Total</b></span>
          <span><b>${bill.totalAmount.toFixed(2)}/=</b></span>
        </div>
        <div class="totals-row">
          <span>Cash Paid</span>
          <span>${bill.cash.toFixed(2)}/=</span>
        </div>
        <div class="totals-row">
          <span>Change</span>
          <span>${bill.change.toFixed(2)}/=</span>
        </div>
      </div>

      <div class="separator"></div>

      <div class="sinhala-note">
        කිරි හා ශීත කළ නිශ්පාදන නැවත භාරගනු හෝ මාරු කරනු නොලැබේ.
      </div>

      <div class="footer">
        Thank You!
      </div>

      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>

    </body>
  </html>
  `;
};