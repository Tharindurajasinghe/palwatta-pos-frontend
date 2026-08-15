export const getOrderHTML = (order) => {
  const formatDate = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    return `${d}.${m}.${y}`;
  };

  const created = new Date(order.createdAt).toLocaleDateString('en-CA').replace(/-/g, '.');

  return `
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Order ${order.orderId}</title>
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

        .header { text-align: center; line-height: 1.2; }
        .header h2 { font-size: 20px; margin: 3px 0; font-weight: bold; }
        .header p { margin: 2px 0; font-size: 14px; }

        .order-tag {
          text-align: center;
          font-weight: bold;
          font-size: 15px;
          margin: 6px 0;
          border: 1px solid #000;
          padding: 3px 0;
        }

        .bill-info { margin-top: 8px; font-size: 14px; line-height: 1.5; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }

        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 4px; font-size: 14px; }
        td { padding: 3px 0; vertical-align: top; }

        .qty, .price, .total { text-align: right; white-space: nowrap; }
        .name  { width: 45%; }
        .qty   { width: 15%; }
        .price { width: 20%; }
        .total { width: 20%; }

        .totals { font-size: 14px; line-height: 1.7; }
        .totals-row { display: flex; justify-content: space-between; }

        .note { font-size: 14px; margin-top: 8px; line-height: 1.4; }
        .footer { text-align: center; font-weight: bold; margin-top: 8px; font-size: 15px; }
      </style>
    </head>

    <body>

      <div class="header">
        <h2>Jagath Store</h2>
        <p>Pasal Mawatha, Okkampitiya</p>
        <p>Tel: 071 6937755</p>
      </div>

      <div class="order-tag">ORDER</div>

      <div class="bill-info">
        <div><b>Order ID:</b> ${order.orderId}</div>
        <div><b>Customer:</b> ${order.customerName}</div>
        <div><b>Tel:</b> ${order.phone}</div>
        <div><b>Deliver:</b> ${formatDate(order.deliveryDate)}${order.deliveryTime ? ' | ' + order.deliveryTime : ''}</div>
        <div><b>Ordered:</b> ${created}</div>
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
          ${order.items.map(i => `
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
          <span><b>Total</b></span>
          <span><b>${order.totalAmount.toFixed(2)}/=</b></span>
        </div>
      </div>

      ${order.message ? `
        <div class="separator"></div>
        <div class="note"><b>Note:</b> ${order.message}</div>
      ` : ''}

      <div class="separator"></div>

      <div class="footer">Thank You!</div>

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