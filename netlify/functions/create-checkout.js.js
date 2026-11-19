exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, bio, goal } = JSON.parse(event.body || '{}');

    if (!email || !bio || !goal) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please complete your email, goal, and bio.' })
      };
    }

    const cleanBio = String(bio).trim();
    const bio1 = cleanBio.slice(0, 500);
    const bio2 = cleanBio.slice(500, 1000);
    const bio3 = cleanBio.slice(1000, 1500);
    const cleanGoal = String(goal).trim().slice(0, 500);

    const origin = event.headers.origin || 'https://profilepulseai.com';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', email.trim());
    params.append('allow_promotion_codes', 'true');
    params.append('success_url', `${origin}/?success=true`);
    params.append('cancel_url', `${origin}/?canceled=true`);
    params.append('line_items[0][price]', process.env.STRIPE_PRICE_ID);
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[bio_1]', bio1);
    params.append('metadata[bio_2]', bio2);
    params.append('metadata[bio_3]', bio3);
    params.append('metadata[goal]', cleanGoal);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: session.error?.message || 'Stripe checkout error' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error creating checkout session' })
    };
  }
};