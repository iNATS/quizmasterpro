import React, { useState, useEffect, useRef } from 'react';
import { Teacher, SubscriptionPlan } from '../../types';
import { DB } from '../../services/db';

const PLANS = [
  { id: 'basic', name: 'Basic Free', price: 0, features: ['10 Quizzes', 'Standard Support', 'Manual CSV Export'] },
  { id: 'pro', name: 'Professional', price: 29, features: ['Unlimited Quizzes', 'Branding Removal', 'PDF Certificates', 'Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 99, features: ['Multi-teacher Seats', 'Custom Domain', 'SLA Guarantee', 'Dedicated Manager'] }
];

const BillingSection: React.FC<{ teacher: Teacher, onUpdate: () => void }> = ({ teacher, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalClientId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID : 'sb';

  useEffect(() => {
    const loadPayPal = async () => {
      if (!(window as any).paypal) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
        script.async = true;
        script.onload = () => renderButtons();
        document.body.appendChild(script);
      } else {
        renderButtons();
      }
    };

    const renderButtons = () => {
      if (paypalContainerRef.current && (window as any).paypal) {
        paypalContainerRef.current.innerHTML = ''; // Clear previous
        (window as any).paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { value: '29.00' }, // Hardcoded for 'Pro' example
                description: 'QuizMaster Pro Subscription'
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            await actions.order.capture();
            handlePlanUpgrade('pro');
          }
        }).render(paypalContainerRef.current);
      }
    };

    loadPayPal();
  }, [paypalClientId]);

  const handlePlanUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      await DB.updateTeacher(teacher.id, { 
        plan: planId as SubscriptionPlan,
        subscriptionStatus: 'active',
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      onUpdate();
      alert(`Payment Successful! Your account has been upgraded to ${planId.toUpperCase()}.`);
    } catch (e) {
      alert("Error synchronizing subscription. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-800">Plan & Billing</h2>
        <p className="text-slate-500">Upgrade your workspace to unlock professional features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {PLANS.map(plan => (
          <div key={plan.id} className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col relative overflow-hidden ${
            teacher.plan === plan.id ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105' : 'bg-white border-slate-100'
          }`}>
            {teacher.plan === plan.id && (
              <div className="absolute top-0 right-0 bg-brand-500 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">Active Plan</div>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-black mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">${plan.price}</span>
                <span className={`text-xs font-bold ${teacher.plan === plan.id ? 'text-slate-400' : 'text-slate-500'}`}>/MO</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-12 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex gap-4 text-sm font-bold">
                  <i className={`fas fa-check-circle mt-1 ${teacher.plan === plan.id ? 'text-brand-400' : 'text-brand-500'}`}></i>
                  <span className={teacher.plan === plan.id ? 'text-slate-200' : 'text-slate-600'}>{f}</span>
                </li>
              ))}
            </ul>

            {teacher.plan === plan.id ? (
              <div className="w-full py-5 text-center font-black uppercase tracking-widest text-xs bg-slate-800 rounded-2xl border border-slate-700">
                You are currently on this plan
              </div>
            ) : (
              <button 
                onClick={() => plan.price === 0 ? handlePlanUpgrade(plan.id) : null}
                className={`w-full py-5 rounded-2xl font-black transition-all shadow-lg ${
                  plan.price === 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-brand-600 text-white hover:bg-brand-500'
                }`}
              >
                {plan.price === 0 ? 'Downgrade' : 'Select Plan'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-12 items-center justify-between">
         <div className="max-w-md">
           <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 text-2xl">
              <i className="fab fa-paypal"></i>
           </div>
           <h4 className="text-2xl font-black text-slate-800 mb-3">Professional Checkout</h4>
           <p className="text-slate-500 font-medium">Safe and secure payments via PayPal. Upgrade to Pro today to enjoy unlimited quiz generation and removal of all master branding.</p>
           {teacher.subscriptionExpiry && (
             <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl text-xs font-black border border-blue-100">
               <i className="fas fa-calendar-check"></i> RENEWAL DATE: {new Date(teacher.subscriptionExpiry).toLocaleDateString()}
             </div>
           )}
         </div>
         <div className="w-full md:w-80 space-y-4">
           <div ref={paypalContainerRef} className="min-h-[150px] flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="text-center animate-pulse">
                <i className="fas fa-circle-notch fa-spin text-slate-300 text-3xl"></i>
              </div>
           </div>
           <p className="text-[9px] text-center font-black text-slate-400 uppercase tracking-widest">Encrypted Payment Gateway</p>
         </div>
      </div>
    </div>
  );
};

export default BillingSection;