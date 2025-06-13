Based on my analysis of the logs and the frontend code, here are the specific changes I suggest for the backend team to fix the subscription flow:

🔧 Backend API Issues & Required Fixes
Issue 1: Incorrect Response Structure for Create Order Endpoint
Current Backend Response:
{
  "success": true,
  "data": {
    "subscription": {
      "user": "684460a82d79be8db0a5829c",
      "plan": "monthly",
      "status": "pending",
      "amount": 19900,
      "currency": "INR",
      "razorpaySubscriptionId": "sub_Qfsg4Bj5X8T7WO",
      "razorpayCustomerId": "cust_QfsannF9fNhGXL",
      // ... other fields
    },
    "razorpaySubscription": {
      // ... razorpay data
    }
  }
}
Required Response Structure:
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 9900,
    "currency": "INR",
    "plan": "monthly",
    "razorpayKeyId": "rzp_live_DPQaE6uBg2h7OS",
    "type": "recurring",
    "subscriptionDetails": {
      "subscriptionId": "sub_xyz123",
      "customerId": "cust_xyz123"
    }
  }
}
Issue 2: Incorrect Amount Calculation
Problem: Backend is returning amount: 19900 (₹199) instead of amount: 9900 (₹99) for monthly plan.

Fix Required:

Monthly plan should return: amount: 9900 (₹99 * 100 for paise)
Yearly plan should return: amount: 49900 (₹499 * 100 for paise)
Issue 3: Missing Required Fields
Missing Fields in Response:

orderId - Required for Razorpay checkout
razorpayKeyId - Should be included in response
Proper amount calculation
Recommended Backend Changes:
1. Update Create Order Response Structure
// In your create-order endpoint
app.post('/api/subscriptions/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Get plan details
    const planDetails = await getPlanDetails(plan); // monthly: ₹99, yearly: ₹499
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: planDetails.price * 100, // Convert to paise (₹99 = 9900 paise)
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    });
    
    // Create subscription record
    const subscription = await createSubscription({
      user: req.user.id,
      plan: plan,
      amount: planDetails.price * 100,
      orderId: razorpayOrder.id,
      // ... other fields
    });
    
    // Return the correct structure
    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: planDetails.price * 100, // 9900 for monthly, 49900 for yearly
        currency: 'INR',
        plan: plan,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Include this
        type: 'recurring',
        subscriptionDetails: {
          subscriptionId: subscription.id,
          customerId: subscription.razorpayCustomerId
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
2. Fix Plan Amount Mapping
const PLAN_AMOUNTS = {
  'monthly': 99,   // ₹99
  'yearly': 499,   // ₹499
  // Remove 'trial': 1 - Don't include trial plan in production
};

function getPlanDetails(planId) {
  const amount = PLAN_AMOUNTS[planId];
  if (!amount) {
    throw new Error(`Invalid plan: ${planId}`);
  }
  
  return {
    id: planId,
    price: amount,
    currency: 'INR'
  };
}