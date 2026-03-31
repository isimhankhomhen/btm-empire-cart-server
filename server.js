const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = {
  type: "service_account",
  project_id: "btm-empire-store",
  private_key_id: "7f8797ea3499f0e1a202ba3a2ba123cf387f00e1",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDbIcC1yxtbejdV\nyitEXKiyr8L6r38YxBY9he5dK2sEGF6Fpfu58J4IksxzRICwYG3fTM2rYCkN77Et\nkRGsgRNQGzgOq3T3eCc/9XZNx0AHTOVZXNEP4mP6RpX4wf2WgF2IBHnXLXU+nKg1\ndtj6uQFq2Y6NRFvVAH7aOe8pIkUHORDk8jmlb0NBKAHBYNSXFs0PJk/EpXTPLz0h\n/PtzATFU3aY/ysUCJKUa7Ks3n/0O4wpLYBaKpax/E4OL6aBuSo2IqPk1unMTv/D/\n2Fl9EJV+Em7wcTn66WhS0aJUmgrpaM7ByQqq2Y6QE/adE9Xzm/eHsYXBjviws8FG\nxwv4YcrLAgMBAAECggEALz2VDnwFX1C3OjL15ex13+O9TI7l/wBS7RuA+iwAi6b3\nRae1X24Mm7uOAPGNLrjzJtcnZaE66Iq6byDdpwtCjxv3F06GTk1kZMj1oqnoV0qQ\nDRZR6bM8K3npHfIwSbBNuaOBYs6lfoSGTNRczZxxvke9kB3jEEXlkwU3Vm5RZE9W\neyhVUgce4jJeKo+K+d+FUUKQFTpDasskzl0jAlX+1M6Cq+ddFARIiAiWYCym+3RQ\nHPrXkbYcC4l22RMJd1jLUcD8qBc/rKDcyiAomCSYZYwMwu2lTuIvvDm18TkPrEv9\n4Ub0/xPAr96OtMabZ1G27GdpXVVc/vUZ69EXtM/G3QKBgQDyeC4yJPvSOK9gbkEO\naqoQQaiicUnJeYRHRT8I4jSt2EoQcZJti+ZS8SioRJ7l6+OG3VYzj9aYcjbgALdA\n283P0BiBR8+NorsgsIkwZ1kk/4V0UMc4jazrC0AZ+Su0ZH7sB3oCx/jE21ZeIJSB\n5iQryDzHTbF74oF5mtJARXnezwKBgQDnXC5IKdK5WddFMqjPfQm9GwtNGOYLZxap\nC4AJK4nbvaMYhT5ZOw8VMdXxO5cP1SktgJf8t6VmJ9m96CIels3U28q9+kIzJhXY\n8aRTpqHSf+bM5AVuio23bSPaVJ44apeaLDzHlHGX6WQjh1FraOxqwvlkKL8/0+3v\njvupm+KzRQKBgQC3v0264H4ZzK1TFZqlkz23vhpOqC2zyivtWtOvJsWnLO7L0VWX\nQNrV5j3abs5ADWhKrveBcbK9qmhdjw1Q0IICx3+akVH/0t+eoUoF7XwH5sA66nBf\nMjZllQwJ4uM0/KeWtP/IlcS3YkTsZiJE4qRsrX0pyH4FFRzri+FjpYL6zwKBgQC2\nJTCax7KLElwUsomMsRhVtVD0ZcHXAFYqyE8I6Sojwe0BhQVNIt4BBbc1sICBioRc\nunzuDXc+MemPRY53Hqr2BgRcBQbRVg6lObjx0qJcIy4F6Q8NtC9WVaqAXVYjfGfW\njTVcu1WjD7Ay+Hn1Yime89l8LUhEbAlLLPqc0YltMQKBgAiG5QwjkI3BPwhT1xR4\noJIdG1kx+DiVnf1tnbO/+20qHx5GCcWcd+EPn5zAldjjMbomrgm9qbu9C3HSGu08\nLPcVn/H4RherTfsWf+ukkSpytiWeQdWX4mSxpmuapUSftd5cMTXctXccYv/XF+HZ\nHNaC1ZiYdPCSomiE5JNPrK8z\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@btm-empire-store.iam.gserviceaccount.com",
  client_id: "101877980037523710068",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40btm-empire-store.iam.gserviceaccount.com"
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'btmempirestore@gmail.com';
const SENDER_NAME = 'BTM Empire Store';
const STORE_URL = 'https://btmempire.free.nf';
const BREVO_LIST_ID = 3;

function genCartId() {
  return Math.random().toString(36).substring(2,8).toUpperCase() +
         Date.now().toString(36).toUpperCase().slice(-4);
}

// Save customer email + phone to Brevo contacts
async function saveContactToBrevo(email, phone, name) {
  try {
    await axios.post('https://api.brevo.com/v3/contacts', {
      email,
      attributes: {
        FIRSTNAME: name || '',
        SMS: phone || '',
        PHONE: phone || ''
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true
    }, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('Contact saved to Brevo:', email, phone);
  } catch (e) {
    console.error('Brevo contact error:', e.response?.data || e.message);
  }
}

async function sendEmail(to, subject, htmlContent) {
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent
    }, {
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
    console.log('Email sent to', to, '-', subject);
    return true;
  } catch (e) {
    console.error('Email error:', e.response?.data || e.message);
    return false;
  }
}

function buildEmail(cart, type) {
  const restoreLink = `${STORE_URL}?cart_id=${cart.cart_id}`;
  const itemsHtml = (cart.items || []).map(item => `
    <tr><td style="padding:14px 16px;border-bottom:1px solid #eef1f8">
      <table cellpadding="0" cellspacing="0"><tr>
        <td width="68" style="vertical-align:top">
          <img src="${item.img||''}" width="64" height="64"
            style="border-radius:8px;object-fit:cover;display:block" alt="${item.name}">
        </td>
        <td style="padding-left:12px;vertical-align:top">
          <div style="font-weight:700;font-size:14px;color:#1a2744">${item.name}</div>
          <div style="font-size:12px;color:#6b7a99">${item.color} &bull; ${item.bundle} &bull; Qty: ${item.qty}</div>
          <div style="font-weight:800;font-size:15px;color:#1a2744;margin-top:6px">$${Number(item.price).toFixed(2)}</div>
        </td>
      </tr></table>
    </td></tr>`).join('');

  const urgency = type === '24hr' ? `
    <div style="background:#fff3e0;border-left:4px solid #f5a623;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0">
      <strong style="color:#e67e00">&#9888; Last Chance!</strong>
      <p style="margin:6px 0 0;color:#7a5a00;font-size:13px">
        Only limited units of <strong>${(cart.items||[])[0]?.name||'this product'}</strong> are left.
        Complete your order before it sells out!
      </p>
    </div>` : '';

  const discount = type === '24hr' ? `
    <div style="text-align:center;margin:16px 0">
      <span style="background:#1a2744;color:#f5a623;padding:9px 22px;border-radius:50px;font-size:13px;font-weight:800;display:inline-block">
        &#127381; Use code BTM10 for 10% off - expires tonight!
      </span>
    </div>` : '';

  const msgs = {
    '30min': { h: 'You left something behind &#128532;', b: 'You left some items in your cart. Complete your order now before stock runs out!' },
    '12hr':  { h: 'Your cart is still waiting &#128722;', b: 'Your cart is saved! Complete your order today and enjoy free shipping on orders over $100.' },
    '24hr':  { h: 'Final reminder - items almost gone &#128293;', b: 'This is your last reminder. Your cart is about to expire and stock is very limited!' }
  };
  const msg = msgs[type] || msgs['30min'];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif">
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7fa;padding:32px 0">
<tr><td>
<table cellpadding="0" cellspacing="0" width="100%"
  style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09)">
  <tr><td style="background:#1a2744;padding:26px 32px;text-align:center">
    <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:0.1em">BTM <span style="color:#f5a623">EMPIRE</span></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;letter-spacing:0.15em">BUILT TO MOVE</div>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 10px;font-size:21px;color:#1a2744">${msg.h}</h2>
    <p style="margin:0 0 24px;color:#6b7a99;font-size:14px;line-height:1.6">${msg.b}</p>
    ${urgency}
    <div style="border:1px solid #eef1f8;border-radius:12px;overflow:hidden;margin-bottom:20px">
      <div style="background:#eef1f8;padding:12px 16px">
        <strong style="font-size:11px;color:#1a2744;letter-spacing:0.08em;text-transform:uppercase">
          Your Cart (${(cart.items||[]).length} item${(cart.items||[]).length!==1?'s':''})
        </strong>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${itemsHtml}
        <tr><td style="padding:14px 16px;text-align:right;border-top:2px solid #eef1f8">
          <span style="font-size:13px;color:#6b7a99">Cart Total: </span>
          <strong style="font-size:19px;color:#1a2744">$${Number(cart.cart_total||0).toFixed(2)}</strong>
        </td></tr>
      </table>
    </div>
    ${discount}
    <div style="text-align:center;margin:26px 0 20px">
      <a href="${restoreLink}" style="background:#1a2744;color:#fff;padding:16px 42px;border-radius:10px;text-decoration:none;display:inline-block;font-weight:800;font-size:15px;letter-spacing:0.05em">
        &#128722; Return To Checkout
      </a>
    </div>
    <p style="text-align:center;font-size:12px;color:#9ba8c0;margin:0;line-height:1.8">
      Free shipping on orders over $100 &bull; 256-bit SSL Secure &bull; Easy returns
    </p>
  </td></tr>
  <tr><td style="background:#f5f7fa;padding:18px 32px;text-align:center;border-top:1px solid #eef1f8">
    <p style="margin:0;font-size:11px;color:#9ba8c0;line-height:1.6">
      You received this because you added items to your cart at BTM Empire Store.<br>
      &copy; ${new Date().getFullYear()} BTM Empire Store. All rights reserved.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

app.get('/', (req, res) => res.json({ status: 'ok', message: 'BTM Empire Cart Server running' }));

app.post('/api/cart/save', async (req, res) => {
  try {
    const { email, items, cart_total, cart_id, phone, name } = req.body;
    if (!email || !items?.length) return res.status(400).json({ error: 'Missing email or items' });
    const id = cart_id || genCartId();

    await db.collection('abandoned_carts').doc(id).set({
      cart_id: id,
      customer_email: email,
      customer_name: name || '',
      customer_phone: phone || '',
      items,
      cart_total: cart_total || 0,
      abandoned_time: Date.now(),
      recovered: false,
      email_30min_sent: false,
      email_12hr_sent: false,
      email_24hr_sent: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Save email + phone to Brevo contacts automatically
    saveContactToBrevo(email, phone || '', name || '');

    console.log(`Cart saved: ${id} for ${email}`);
    res.json({ success: true, cart_id: id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cart/recover', async (req, res) => {
  try {
    const { cart_id, email } = req.body;
    let ref = null;
    if (cart_id) {
      ref = db.collection('abandoned_carts').doc(cart_id);
    } else if (email) {
      const snap = await db.collection('abandoned_carts')
        .where('customer_email', '==', email)
        .where('recovered', '==', false)
        .orderBy('abandoned_time', 'desc').limit(1).get();
      if (!snap.empty) ref = snap.docs[0].ref;
    }
    if (ref) await ref.update({ recovered: true, recovered_at: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cart/:cart_id', async (req, res) => {
  try {
    const doc = await db.collection('abandoned_carts').doc(req.params.cart_id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Cart not found' });
    res.json({ success: true, cart: doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const snap = await db.collection('abandoned_carts').orderBy('abandoned_time', 'desc').limit(200).get();
    const carts = snap.docs.map(d => d.data());
    const total = carts.length;
    const recovered = carts.filter(c => c.recovered).length;
    const revenue = carts.filter(c => c.recovered).reduce((a, c) => a + (c.cart_total || 0), 0);
    const rate = total > 0 ? ((recovered / total) * 100).toFixed(1) : 0;
    res.json({ total_abandoned: total, recovered, revenue: revenue.toFixed(2), conversion_rate: rate + '%', carts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

cron.schedule('*/5 * * * *', async () => {
  const now = Date.now();
  const MIN30 = 30 * 60 * 1000;
  const HR12  = 12 * 60 * 60 * 1000;
  const HR24  = 24 * 60 * 60 * 1000;
  const HR25  = 25 * 60 * 60 * 1000;
  try {
    const snap = await db.collection('abandoned_carts').where('recovered', '==', false).get();
    for (const doc of snap.docs) {
      const cart = doc.data();
      const age = now - cart.abandoned_time;
      if (!cart.email_30min_sent && age >= MIN30 && age < HR12) {
        const sent = await sendEmail(cart.customer_email, 'You left something behind', buildEmail(cart, '30min'));
        if (sent) await doc.ref.update({ email_30min_sent: true });
      }
      if (!cart.email_12hr_sent && age >= HR12 && age < HR24) {
        const sent = await sendEmail(cart.customer_email, 'Your cart is still waiting', buildEmail(cart, '12hr'));
        if (sent) await doc.ref.update({ email_12hr_sent: true });
      }
      if (!cart.email_24hr_sent && age >= HR24 && age < HR25) {
        const sent = await sendEmail(cart.customer_email, 'Last chance! Items almost gone', buildEmail(cart, '24hr'));
        if (sent) await doc.ref.update({ email_24hr_sent: true });
      }
    }
  } catch (e) {
    console.error('Cron error:', e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BTM Empire Cart Server running on port ${PORT}`));
