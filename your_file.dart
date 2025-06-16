Map<String, dynamic> options = {
  'key': razorpayKey,
  'name': 'GyaniFy App',
  'description': '${_selectedPlan!.name} Subscription',
  'subscription_id': orderData.subscriptionId,
  'currency': 'INR',
  'prefill': {
    'contact': '9403012499',
    'email': user?.email ?? 'praveenkumar1090@gmail.com'
  },
  'theme': {
    'color': '#F7B801'
  }
};