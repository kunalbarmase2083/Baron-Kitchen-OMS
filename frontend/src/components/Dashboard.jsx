import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquarePlus, RefreshCw, DollarSign, Package, CheckCircle, Moon, Sun, ChefHat, Printer } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const parseMessyText = (text) => {
    let quantity = 1;
    let client_name = "Unknown Client";
    let item_name = "Custom Order";
    
    // 1. Number -> Quantity
    const qtyMatch = text.match(/\b(\d+)\b/);
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
    }
    
    // 2. Capitalized Word -> Client Name
    const capitalizedWords = text.match(/\b([A-Z][A-Za-z]+)\b/g);
    if (capitalizedWords) {
        const filtered = capitalizedWords.filter(w => 
            !["Thalis", "Thali", "Veg", "Baron", "Kitchen", "For", "The"].includes(w)
        );
        if (filtered.length > 0) {
            client_name = filtered[filtered.length - 1]; // Pick the last highlighted cap word
        }
    }

    if (text.toLowerCase().includes("thali")) {
        item_name = "Veg Thali";
    }

    return {
        client_name,
        status: "Pending",
        grand_total: quantity * 15.0, 
        items: [
            { item_name, quantity }
        ]
    };
};

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [text, setText] = useState("");
  const [submitState, setSubmitState] = useState('idle');
  const [activeTab, setActiveTab] = useState('capture'); // 'capture' | 'kitchen'
  // Auto-detect system preference or default to false
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
        });
      });
      setOrders(fetchedOrders);
    }, (error) => {
      console.error("Firestore Sync Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitState('processing');
    try {
      const parsedData = parseMessyText(text);
      await addDoc(collection(db, "orders"), {
        ...parsedData,
        raw_text: text,
        timestamp: serverTimestamp()
      });
      setSubmitState('success');
      setText("");
    } catch (e) {
      console.error("Error saving to Firestore:", e);
      setSubmitState('idle');
    }
  };

  const markAsReady = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Completed"
      });
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 30px; }
            .header h2 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 5px 0 0 0; color: #666; }
            .meta { margin-bottom: 30px; font-size: 14px; color: #555; }
            .meta strong { color: #000; }
            .item { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 10px 0; font-size: 18px; }
            .total { font-weight: bold; text-align: right; margin-top: 30px; border-top: 2px solid #222; padding-top: 20px; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Baron Kitchen</h2>
            <p>Official Digital Receipt</p>
          </div>
          <div class="meta">
            <p><strong>Order Reference:</strong> #${order.id}</p>
            <p><strong>Client:</strong> ${order.client_name}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          ${(order.items || []).map(i => `
            <div class="item">
              <span><strong>${i.quantity}x</strong> ${i.item_name}</span>
            </div>
          `).join('')}
          <div class="total">
            Grand Total: $${order.grand_total ? order.grand_total.toFixed(2) : '0.00'}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const revenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.grand_total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className={`${isDarkMode ? 'dark' : ''} transition-colors duration-300 w-full`}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 border-t-4 border-indigo-600 dark:bg-slate-900 dark:text-white font-sans transition-colors duration-300">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 md:flex flex-col hidden sticky top-0 h-screen transition-colors duration-300">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">
                <LayoutDashboard className="w-6 h-6" />
              </span>
              OMS Core
            </h1>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            <button 
              onClick={() => setActiveTab('capture')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'capture' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800/50' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:text-slate-400 border border-transparent'}`}
            >
              <MessageSquarePlus className="w-5 h-5"/> Live OMS
            </button>
            <button 
              onClick={() => setActiveTab('kitchen')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'kitchen' ? 'bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 shadow-sm border border-orange-100 dark:border-orange-800/50' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:text-slate-400 border border-transparent'}`}
            >
              <ChefHat className="w-5 h-5"/> Kitchen Display KDS
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900/95 transition-colors">
          <header className="bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 z-20 gap-4 transition-colors">
            <h2 className="text-2xl font-bold">
              {activeTab === 'capture' ? 'Revenue Dashboard' : 'Kitchen Firing Line'}
            </h2>
            <div className="flex gap-4 w-full sm:w-auto items-center">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
              </button>
              <div className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm border border-green-200 dark:border-green-800/50 flex-1 sm:flex-none justify-center">
                <DollarSign className="w-4 h-4"/> ${revenue.toFixed(2)} Collected
              </div>
              <div className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm border border-orange-200 dark:border-orange-800/50 flex-1 sm:flex-none justify-center animate-pulse">
                <ChefHat className="w-4 h-4"/> {pendingOrders} Cooking
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
            
            {activeTab === 'capture' ? (
              <div className="space-y-8 animate-fade-in">
                {/* Magic AI Input Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all min-h-[290px] flex flex-col justify-center relative overflow-hidden group">
                  {submitState === 'success' ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in z-10 w-full h-full">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shadow-inner mb-2 ring-4 ring-green-50 dark:ring-green-900/20">
                        <CheckCircle className="w-8 h-8" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Order Successful!</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
                        The magic order has been perfectly parsed and saved to the Live Pipeline.
                      </p>
                      <button
                        onClick={() => setSubmitState('idle')}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-8 py-3 rounded-xl font-bold transition-all shadow border border-slate-200 dark:border-slate-600 active:scale-95 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4"/> Order Again
                      </button>
                    </div>
                  ) : (
                    <div className="animate-fade-in w-full transition-opacity duration-300">
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <MessageSquarePlus className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                        Magic AI Input (Firebase)
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 font-medium">Paste messages. The local parser structures them and actively syncs them to your Firestore Database.</p>
                      <textarea
                        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 dark:text-slate-100 font-mono text-sm resize-none mb-5 placeholder-slate-400 shadow-inner transition-colors disabled:opacity-50"
                        placeholder="e.g. 20 Thalis for Baron Kitchen - Kunal"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={submitState === 'processing'}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmit}
                          disabled={submitState === 'processing' || !text.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          {submitState === 'processing' ? <RefreshCw className="w-5 h-5 animate-spin"/> : null}
                          {submitState === 'processing' ? 'Processing Transaction...' : 'Submit Magic Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Captured Orders Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Live Operations Pipeline</h3>
                    <div className="text-green-500 dark:text-green-400 font-medium text-sm flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/50 shadow-sm">
                      <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live Sync Active
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Client Name</th>
                          <th className="px-6 py-4">Kitchen Breakdown</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Export</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                              <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
                              <p className="font-medium text-lg">The kitchen is awaiting orders.</p>
                            </td>
                          </tr>
                        ) : (
                          orders.map((o) => (
                            <tr key={o.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-5 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                                #{o.id.substring(0, 9)}...
                              </td>
                              <td className="px-6 py-5 font-bold text-slate-900 dark:text-white text-base">
                                {o.client_name}
                              </td>
                              <td className="px-6 py-5">
                                {o.items && o.items.length > 0 ? (
                                  <div className="flex flex-col gap-1.5">
                                    {o.items.map((i, idx) => (
                                      <span key={idx} className="text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm w-max">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mr-1.5">{i.quantity}x</span> {i.item_name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </td>
                              <td className="px-6 py-5 font-black text-slate-900 dark:text-white text-lg">
                                ${o.grand_total ? o.grand_total.toFixed(2) : '0.00'}
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1.5 text-xs font-bold rounded-md tracking-wide border shadow-sm ${o.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/50'}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <button 
                                  onClick={() => handlePrint(o)} 
                                  className="p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-transform active:scale-90 mx-auto shadow-sm"
                                  title="Print PDF Receipt"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* KITCHEN DISPLAY SYSTEM TAB */
              <div className="space-y-6 animate-fade-in pb-12">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Kitchen Display</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Head Chef View - Tap orders to mark them as completed.</p>
                  </div>
                  <div className="hidden md:flex gap-3">
                    <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-lg font-bold text-sm">Priority: Highest</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {orders.filter(o => o.status === 'Pending').map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border-t-8 border-orange-500 p-6 flex flex-col justify-between animate-fade-in transform transition-all duration-300 hover:-translate-y-2 hover:shadow-orange-500/10 h-80 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                      
                      <div className="z-10 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold font-mono text-slate-500 dark:text-slate-400">
                            #{order.id.substring(0,5)}
                          </h3>
                          <span className="text-xs font-black px-2.5 py-1 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-md tracking-wider">
                            URGENT
                          </span>
                        </div>
                        
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-4 line-clamp-1">{order.client_name}</h4>
                        
                        <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          {order.items?.map((item, idx) => (
                             <div key={idx} className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-lg font-bold border-b border-slate-100 dark:border-slate-700/50 pb-3">
                               <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-black flex items-center justify-center shadow-sm text-xl flex-shrink-0">
                                 {item.quantity}
                               </div>
                               <span className="leading-tight">{item.item_name}</span>
                             </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => markAsReady(order.id)} 
                        className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/30 active:scale-[0.98] text-white font-black text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 z-10"
                      >
                        <CheckCircle className="w-6 h-6"/> MARK READY
                      </button>
                    </div>
                  ))}
                  
                  {orders.filter(o => o.status === 'Pending').length === 0 && (
                    <div className="col-span-full py-32 bg-white/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <ChefHat className="w-12 h-12 text-slate-400 dark:text-slate-500"/>
                      </div>
                      <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 mb-2">Kitchen is clear!</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">All orders are complete. Time for a break.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
