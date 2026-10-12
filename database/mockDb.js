const crypto = require('crypto');
const dhakaRoutesData = require('./dhakaRoutes');
function id() { return crypto.randomBytes(12).toString('hex'); }
let _idCounter = 0;
function detId(prefix) { return `${prefix}_${++_idCounter}`; }
function resetIdCounter() { _idCounter = 0; }

const db = {
  users: [], buses: [], routes: [], fares: [], announcements: [], notifications: [],
  operators: [], stops: [], traffic_data: [], search_history: [], favorites: []
};

class Doc {
  constructor(data, collection) {
    Object.assign(this, data);
    if (!this._id) this._id = id();
    this.collection = collection;
  }
  save() {
    const idx = db[this.collection].findIndex(d => d._id === this._id);
    if (idx === -1) { this.createdAt = new Date(); db[this.collection].push(this); }
    else db[this.collection][idx] = this;
    return Promise.resolve(this);
  }
  populate() { return this; }
  comparePassword(pwd) { return Promise.resolve(pwd === this.password.split('_')[0]); }
}

const User = {
  findById(id) { const d = db.users.find(x => x._id === id); return Promise.resolve(d ? Object.assign(new Doc(d, 'users'), { comparePassword(pwd) { return Promise.resolve(pwd === this.password.split('_')[0]); } }) : null); },
  findOne(query = {}) {
    let results = [...db.users];
    if (query.username) results = results.filter(d => d.username?.toLowerCase() === query.username.toLowerCase());
    if (query.email) results = results.filter(d => d.email?.toLowerCase() === query.email.toLowerCase());
    if (query.role) results = results.filter(d => d.role === query.role);
    const d = results[0];
    if (d) return Promise.resolve(Object.assign(new Doc(d, 'users'), { comparePassword(pwd) { return Promise.resolve(pwd === this.password.split('_')[0]); } }));
    return Promise.resolve(null);
  },
  findByIdAndUpdate(id, data, opts = {}) {
    const idx = db.users.findIndex(d => d._id === id);
    if (idx === -1) return Promise.resolve(null);
    if (data.$push) { const [k, v] = Object.entries(data.$push)[0]; db.users[idx][k] = db.users[idx][k] || []; db.users[idx][k].push(v); }
    else if (data.$pull) { const [k, v] = Object.entries(data.$pull)[0]; db.users[idx][k] = (db.users[idx][k] || []).filter(x => x.toString() !== v.toString()); }
    else Object.assign(db.users[idx], data);
    return Promise.resolve(opts.new ? db.users[idx] : db.users[idx]);
  },
  countDocuments() { return Promise.resolve(db.users.length); }
};

const Route = {
  findById(id) { const d = db.routes.find(x => x._id === id); return Promise.resolve(d ? new Doc(d, 'routes') : null); },
  findByIdAndUpdate(id, data) { const idx = db.routes.findIndex(d => d._id === id); if (idx === -1) return Promise.resolve(null); Object.assign(db.routes[idx], data); return Promise.resolve(new Doc(db.routes[idx], 'routes')); }
};
const Bus = {
  findById(id) { const d = db.buses.find(x => x._id === id); return Promise.resolve(d ? new Doc(d, 'buses') : null); },
  findByIdAndUpdate(id, data) { const idx = db.buses.findIndex(d => d._id === id); if (idx === -1) return Promise.resolve(null); Object.assign(db.buses[idx], data); return Promise.resolve(new Doc(db.buses[idx], 'buses')); }
};

function seedDatabase() {
  if (db.users.length > 0) return;
  resetIdCounter();

  // ========== USERS ==========
  db.users.push(
    { _id: detId('user'), username: 'admin', name: 'Admin', email: 'admin@bd.com', password: 'admin123_hashed', role: 'admin', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: detId('user'), username: 'user', name: 'Demo User', email: 'user@bd.com', password: 'user123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: detId('user'), username: 'sams', name: 'Sams Alif', email: 'sams@bd.com', password: 'sams123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: detId('user'), username: 'passenger', name: 'Rafiq Hasan', email: 'rafiq@bd.com', password: 'pass123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() }
  );

  // ========== OPERATORS ==========
  const operators = [
    { name: 'বিআরটিসি', shortName: 'BRTC', city: 'ঢাকা', type: 'government', phone: '০২-৯৩৫১২৩৪', website: 'brtc.gov.bd', isActive: true },
    { name: 'গ্রীন লাইন', shortName: 'Green Line', city: 'ঢাকা', type: 'private', phone: '০১৭২১-৭৮৯০১২', website: 'greenlinebd.com', isActive: true },
    { name: 'হানিফ এন্টারপ্রাইজ', shortName: 'Hanif', city: 'ঢাকা', type: 'private', phone: '০১৭২২-৩৪৫৬৭৮', website: 'hanifenterprise.com', isActive: true },
    { name: 'সোহাগ পরিবহন', shortName: 'Shohagh', city: 'ঢাকা', type: 'private', phone: '০১৭৩০-৭৮৯০১২', website: 'shohagh.com', isActive: true },
    { name: 'শ্যামলী পরিবহন', shortName: 'Shyamoli', city: 'ঢাকা', type: 'private', phone: '০১৭২৬-১২৩৪৫৬', website: 'shyamoliparibahan.com', isActive: true },
    { name: 'সেন্ট মার্টিন পরিবহন', shortName: 'Saint Martin', city: 'ঢাকা', type: 'private', phone: '০১৭২৫-৪৫৬৭৮৯', isActive: true },
    { name: 'এনা ট্রান্সপোর্ট', shortName: 'Ena', city: 'ঢাকা', type: 'private', phone: '০১৭২৭-৭৮৯০১২', isActive: true },
    { name: 'দেশ ট্রাভেলস', shortName: 'Desh Travels', city: 'ঢাকা', type: 'private', phone: '০১৭২৮-৩৪৫৬৭৮', isActive: true },
    { name: 'নাবিল পরিবহন', shortName: 'Nabil', city: 'ঢাকা', type: 'private', phone: '০১৭২৪-৭৮৯০১২', isActive: true },
    { name: 'সাকুরা পরিবহন', shortName: 'Sakura', city: 'ঢাকা', type: 'private', phone: '০১৭২৯-১২৩৪৫৬', isActive: true },
    { name: 'টুঙ্গিপাড়া এক্সপ্রেস', shortName: 'Tungipara Express', city: 'ঢাকা', type: 'private', phone: '০১৭৩১-১২৩৪৫৬', isActive: true },
    { name: 'এস আর ট্রাভেলস', shortName: 'SR Travels', city: 'বগুড়া', type: 'private', phone: '০১৭৩২-৭৮৯০১২', isActive: true },
    { name: 'সৌদিয়া পরিবহন', shortName: 'Soudia', city: 'চট্টগ্রাম', type: 'private', phone: '০১৭২৩-১২৩৪৫৬', isActive: true },
    { name: 'লন্ডন এক্সপ্রেস', shortName: 'London Express', city: 'ঢাকা', type: 'private', phone: '০১৭৩৩-৪৫৬৭৮৯', isActive: true },
    { name: 'রয়েল কোচ', shortName: 'Royal Coach', city: 'ঢাকা', type: 'private', phone: '০১৭৩৪-১২৩৪৫৬', isActive: true },
    { name: 'স্টার লাইন স্পেশাল', shortName: 'Star Line', city: 'ফেনী', type: 'private', phone: '০১৭৩৫-৭৮৯০১২', isActive: true },
    { name: 'লাল সবুজ পরিবহন', shortName: 'Lal Sobuj', city: 'নোয়াখালী', type: 'private', phone: '০১৭৩৬-৩৪৫৬৭৮', isActive: true },
    { name: 'তিশা পরিবহন', shortName: 'Tisha', city: 'কুমিল্লা', type: 'private', phone: '০১৭৩৭-১২৩৪৫৬', isActive: true },
    { name: 'এশিয়া এয়ারকন', shortName: 'Asia Aircon', city: 'কুমিল্লা', type: 'private', phone: '০১৭৩৮-৭৮৯০১২', isActive: true },
    { name: 'গোল্ডেন লাইন', shortName: 'Golden Line', city: 'ফরিদপুর', type: 'private', phone: '০১৭৩৯-৪৫৬৭৮৯', isActive: true },
    { name: 'এসবি সুপার ডিলাক্স', shortName: 'SB Super Deluxe', city: 'কুষ্টিয়া', type: 'private', phone: '০১৭৪০-১২৩৪৫৬', isActive: true },
    { name: 'পাবনা এক্সপ্রেস', shortName: 'Pabna Express', city: 'পাবনা', type: 'private', phone: '০১৭৪১-৭৮৯০১২', isActive: true },
    { name: 'ইগল পরিবহন', shortName: 'Eagle', city: 'খুলনা', type: 'private', phone: '০১৭৪২-৩৪৫৬৭৮', isActive: true },
    { name: 'সুন্দরবন পরিবহন', shortName: 'Sundarban', city: 'খুলনা', type: 'private', phone: '০১৭৪৩-১২৩৪৫৬', isActive: true },
    { name: 'সোনারতরী পরিবহন', shortName: 'Sonartori', city: 'বরিশাল', type: 'private', phone: '০১৭৪৪-৭৮৯০১২', isActive: true },
    { name: 'সুরভী পরিবহন', shortName: 'Suravi', city: 'বরিশাল', type: 'private', phone: '০১৭৪৫-৩৪৫৬৭৮', isActive: true },
    { name: 'ধানসিঁড়ি পরিবহন', shortName: 'Dhansiri', city: 'বরিশাল', type: 'private', phone: '০১৭৪৬-১২৩৪৫৬', isActive: true },
    { name: 'আজমেরী গ্লোরী', shortName: 'Azmeri Glory', city: 'ঢাকা', type: 'private', phone: '০১৭১১-১২৩৪৫৬', isActive: true },
    { name: 'গাজীপুর পরিবহন', shortName: 'Gazipur Paribahan', city: 'গাজীপুর', type: 'private', phone: '০১৭১২-৭৮৯০১২', isActive: true },
    { name: 'আলিফ পরিবহন', shortName: 'Alif', city: 'ঢাকা', type: 'private', phone: '০১৭১৩-৪৫৬৭৮৯', isActive: true },
    { name: 'বিহঙ্গ পরিবহন', shortName: 'Bihanga', city: 'ঢাকা', type: 'private', phone: '০১৭১৪-১২৩৪৫৬', isActive: true },
    { name: 'প্রজাপতি পরিবহন', shortName: 'Projapati', city: 'ঢাকা', type: 'private', phone: '০১৭১৫-৭৮৯০১২', isActive: true },
    { name: 'শিখর পরিবহন', shortName: 'Shikhor', city: 'ঢাকা', type: 'private', phone: '০১৭১৬-৩৪৫৬৭৮', isActive: true },
    { name: 'রাইদা পরিবহন', shortName: 'Raida', city: 'ঢাকা', type: 'private', phone: '০১৭১৭-১২৩৪৫৬', isActive: true },
    { name: 'অনাবিল সুপার', shortName: 'Anabil', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭১৮-৭৮৯০১২', isActive: true },
    { name: 'তুরাগ পরিবহন', shortName: 'Turag', city: 'ঢাকা', type: 'private', phone: '০১৭১৯-৪৫৬৭৮৯', isActive: true },
    { name: 'ভিক্টর ক্লাসিক', shortName: 'Victor Classic', city: 'ঢাকা', type: 'private', phone: '০১৭২০-১২৩৪৫৬', isActive: true },
    { name: 'বাসুমতি পরিবহন', shortName: 'Basumati', city: 'গাজীপুর', type: 'private', phone: '০১৭২১-৭৮৯০১২', isActive: true },
    { name: 'ভিআইপি ২৭', shortName: 'VIP 27', city: 'ঢাকা', type: 'private', phone: '০১৭২২-৩৪৫৬৭৮', isActive: true },
    { name: 'হিমাচল পরিবহন', shortName: 'Himachal', city: 'ঢাকা', type: 'private', phone: '০১৭২৩-১২৩৪৫৬', isActive: true },
    { name: 'লাব্বাইক পরিবহন', shortName: 'Labbaik', city: 'ঢাকা', type: 'private', phone: '০১৭২৪-৭৮৯০১২', isActive: true },
    { name: 'বিকল্প অটো সার্ভিস', shortName: 'Bikolpo', city: 'ঢাকা', type: 'private', phone: '০১৭২৫-৪৫৬৭৮৯', isActive: true },
    { name: 'অছিম পরিবহন', shortName: 'Achim', city: 'ঢাকা', type: 'private', phone: '০১৭২৬-১২৩৪৫৬', isActive: true },
    { name: 'আকাশ পরিবহন', shortName: 'Akash', city: 'ঢাকা', type: 'private', phone: '০১৭২৭-৭৮৯০১২', isActive: true },
    { name: 'বলাকা পরিবহন', shortName: 'Balaka', city: 'ঢাকা', type: 'private', phone: '০১৭২৮-৩৪৫৬৭৮', isActive: true },
    { name: 'ট্রাস্ট ট্রান্সপোর্ট', shortName: 'Trust Transport', city: 'ঢাকা', type: 'private', phone: '০১৭২৯-১২৩৪৫৬', isActive: true }
  ];
  operators.forEach(o => db.operators.push({ _id: detId('op'), ...o }));

  // ========== STOPS (Dhaka Metropolitan + All 64 Districts) ==========
  const stopList = [
    { name: 'মতিঝিল', bn: 'Motijheel', lat: 23.7330, lng: 90.4170, area: 'Motijheel', city: 'ঢাকা' },
    { name: 'গুলিস্তান', bn: 'Gulistan', lat: 23.7300, lng: 90.4110, area: 'Gulistan', city: 'ঢাকা' },
    { name: 'পল্টন', bn: 'Paltan', lat: 23.7350, lng: 90.4140, area: 'Paltan', city: 'ঢাকা' },
    { name: 'শাহবাগ', bn: 'Shahbagh', lat: 23.7380, lng: 90.3950, area: 'Shahbagh', city: 'ঢাকা' },
    { name: 'ফার্মগেট', bn: 'Farmgate', lat: 23.7570, lng: 90.3900, area: 'Farmgate', city: 'ঢাকা' },
    { name: 'কাওরান বাজার', bn: 'Kawran Bazar', lat: 23.7500, lng: 90.3930, area: 'Kawran Bazar', city: 'ঢাকা' },
    { name: 'শ্যামলী', bn: 'Shyamoli', lat: 23.7700, lng: 90.3700, area: 'Shyamoli', city: 'ঢাকা' },
    { name: 'আগারগাঁও', bn: 'Agargaon', lat: 23.7770, lng: 90.3750, area: 'Agargaon', city: 'ঢাকা' },
    { name: 'বিজয় সরণি', bn: 'Bijoy Sarani', lat: 23.7600, lng: 90.3850, area: 'Bijoy Sarani', city: 'ঢাকা' },
    { name: 'মহাখালী', bn: 'Mohakhali', lat: 23.7700, lng: 90.4000, area: 'Mohakhali', city: 'ঢাকা' },
    { name: 'বনানী', bn: 'Banani', lat: 23.7800, lng: 90.4050, area: 'Banani', city: 'ঢাকা' },
    { name: 'গুলশান', bn: 'Gulshan', lat: 23.7900, lng: 90.4100, area: 'Gulshan', city: 'ঢাকা' },
    { name: 'কুড়িল', bn: 'Kuril', lat: 23.8000, lng: 90.4200, area: 'Kuril', city: 'ঢাকা' },
    { name: 'বাড্ডা', bn: 'Badda', lat: 23.7850, lng: 90.4250, area: 'Badda', city: 'ঢাকা' },
    { name: 'রামপুরা', bn: 'Rampura', lat: 23.7750, lng: 90.4300, area: 'Rampura', city: 'ঢাকা' },
    { name: 'মালিবাগ', bn: 'Malibagh', lat: 23.7600, lng: 90.4250, area: 'Malibagh', city: 'ঢাকা' },
    { name: 'যাত্রাবাড়ী', bn: 'Jatrabari', lat: 23.7100, lng: 90.4300, area: 'Jatrabari', city: 'ঢাকা' },
    { name: 'সায়েদাবাদ', bn: 'Sayedabad', lat: 23.7200, lng: 90.4350, area: 'Jatrabari', city: 'ঢাকা' },
    { name: 'গাবতলি', bn: 'Gabtoli', lat: 23.7820, lng: 90.3450, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'কল্যাণপুর', bn: 'Kallyanpur', lat: 23.7800, lng: 90.3400, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'মিরপুর ১', bn: 'Mirpur 1', lat: 23.7800, lng: 90.3600, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'মিরপুর ১০', bn: 'Mirpur 10', lat: 23.7900, lng: 90.3650, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'মিরপুর ১২', bn: 'Mirpur 12', lat: 23.8000, lng: 90.3550, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'উত্তরা', bn: 'Uttara', lat: 23.8750, lng: 90.3850, area: 'Uttara', city: 'ঢাকা' },
    { name: 'বিমানবন্দর', bn: 'Airport', lat: 23.8500, lng: 90.4000, area: 'Airport', city: 'ঢাকা' },
    { name: 'আব্দুল্লাহপুর', bn: 'Abdullahpur', lat: 23.8800, lng: 90.3950, area: 'Uttara', city: 'ঢাকা' },
    { name: 'টঙ্গী', bn: 'Tongi', lat: 23.8900, lng: 90.4050, area: 'Tongi', city: 'গাজীপুর' },
    { name: 'গাজীপুর চৌরাস্তা', bn: 'Gazipur Chourasta', lat: 23.9900, lng: 90.4200, area: 'Gazipur', city: 'গাজীপুর' },
    { name: 'সাভার', bn: 'Savar', lat: 23.8580, lng: 90.2670, area: 'Savar', city: 'ঢাকা' },
    { name: 'নবীনগর', bn: 'Nabinagar', lat: 23.8800, lng: 90.3000, area: 'Savar', city: 'ঢাকা' },
    { name: 'চন্দ্রা', bn: 'Chandra', lat: 24.0300, lng: 90.2400, area: 'Gazipur', city: 'গাজীপুর' },
    { name: 'নারায়ণগঞ্জ', bn: 'Narayanganj', lat: 23.6200, lng: 90.5000, area: 'Narayanganj', city: 'নারায়ণগঞ্জ' },
    { name: 'চাষাড়া', bn: 'Chashara', lat: 23.6700, lng: 90.4400, area: 'Chashara', city: 'নারায়ণগঞ্জ' },
    { name: 'সাইনবোর্ড', bn: 'Signboard', lat: 23.6900, lng: 90.4350, area: 'Signboard', city: 'ঢাকা' },
    { name: 'মোহাম্মদপুর', bn: 'Mohammadpur', lat: 23.7600, lng: 90.3500, area: 'Mohammadpur', city: 'ঢাকা' },
    { name: 'ধানমন্ডি', bn: 'Dhanmondi', lat: 23.7450, lng: 90.3800, area: 'Dhanmondi', city: 'ঢাকা' },
    { name: 'আজিমপুর', bn: 'Azimpur', lat: 23.7290, lng: 90.3850, area: 'Azimpur', city: 'ঢাকা' },
    { name: 'নিউ মার্কেট', bn: 'New Market', lat: 23.7330, lng: 90.3840, area: 'New Market', city: 'ঢাকা' },
    { name: 'সায়েন্স ল্যাব', bn: 'Science Lab', lat: 23.7380, lng: 90.3830, area: 'Dhanmondi', city: 'ঢাকা' },
    { name: 'সদরঘাট', bn: 'Sadarghat', lat: 23.7060, lng: 90.4050, area: 'Old Dhaka', city: 'ঢাকা' },
    { name: 'ডেমরা স্টাফ কোয়ার্টার', bn: 'Demra', lat: 23.7200, lng: 90.4800, area: 'Demra', city: 'ঢাকা' },
    { name: 'বনশ্রী', bn: 'Banasree', lat: 23.7650, lng: 90.4350, area: 'Banasree', city: 'ঢাকা' },
    { name: 'দিয়াবাড়ি', bn: 'Diabari', lat: 23.8800, lng: 90.3700, area: 'Uttara', city: 'ঢাকা' },
    { name: 'পদ্মা সেতু', bn: 'Padma Bridge', lat: 23.4470, lng: 90.2600, area: 'Mawa', city: 'মুন্সীগঞ্জ' },

    // Division & District Hubs
    { name: 'চট্টগ্রাম', bn: 'Chattogram', lat: 22.3569, lng: 91.7832, area: 'Dampara', city: 'চট্টগ্রাম' },
    { name: 'কক্সবাজার', bn: 'Cox\'s Bazar', lat: 21.4272, lng: 92.0058, area: 'Kolatoli', city: 'কক্সবাজার' },
    { name: 'সিলেট', bn: 'Sylhet', lat: 24.8949, lng: 91.8687, area: 'Kadamtoli', city: 'সিলেট' },
    { name: 'শ্রীমঙ্গল', bn: 'Sreemangal', lat: 24.3065, lng: 91.7296, area: 'Sreemangal', city: 'মৌলভীবাজার' },
    { name: 'রাজশাহী', bn: 'Rajshahi', lat: 24.3636, lng: 88.6241, area: 'Shiroil', city: 'রাজশাহী' },
    { name: 'বগুড়া', bn: 'Bogura', lat: 24.8465, lng: 89.3777, area: 'Charmatha', city: 'বগুড়া' },
    { name: 'রংপুর', bn: 'Rangpur', lat: 25.7439, lng: 89.2752, area: 'Kamarpara', city: 'রংপুর' },
    { name: 'দিনাজপুর', bn: 'Dinajpur', lat: 25.6217, lng: 88.6355, area: 'Dinajpur Sadar', city: 'দিনাজপুর' },
    { name: 'খুলনা', bn: 'Khulna', lat: 22.8456, lng: 89.5403, area: 'Sonadanga', city: 'খুলনা' },
    { name: 'বরিশাল', bn: 'Barishal', lat: 22.7010, lng: 90.3535, area: 'Nathullabad', city: 'বরিশাল' },
    { name: 'কুয়াকাটা', bn: 'Kuakata', lat: 21.8167, lng: 90.1167, area: 'Beach Moor', city: 'পটুয়াখালী' },
    { name: 'কুমিল্লা', bn: 'Cumilla', lat: 23.4607, lng: 91.1809, area: 'Sasongachha', city: 'কুমিল্লা' },
    { name: 'ফেনী', bn: 'Feni', lat: 23.0186, lng: 91.3966, area: 'Mohipal', city: 'ফেনী' },
    { name: 'নোয়াখালী', bn: 'Noakhali', lat: 22.8696, lng: 91.0998, area: 'Maijdee', city: 'নোয়াখালী' },
    { name: 'ময়মনসিংহ', bn: 'Mymensingh', lat: 24.7471, lng: 90.4203, area: 'Maskanda', city: 'ময়মনসিংহ' },
    { name: 'টাঙ্গাইল', bn: 'Tangail', lat: 24.2513, lng: 89.9167, area: 'New Bus Stand', city: 'টাঙ্গাইল' },
    { name: 'কুষ্টিয়া', bn: 'Kushtia', lat: 23.9013, lng: 89.1205, area: 'Mazampur', city: 'কুষ্টিয়া' },
    { name: 'যশোর', bn: 'Jessore', lat: 23.1664, lng: 89.2137, area: 'Monihar', city: 'যশোর' },
    { name: 'বেনাপোল', bn: 'Benapole', lat: 23.0425, lng: 88.8986, area: 'Border', city: 'যশোর' },
    { name: 'পাবনা', bn: 'Pabna', lat: 24.0064, lng: 89.2372, area: 'Pabna Sadar', city: 'পাবনা' },
    { name: 'বান্দরবান', bn: 'Bandarban', lat: 22.1953, lng: 92.2184, area: 'Bandarban', city: 'বান্দরবান' },
    { name: 'রাঙ্গামাটি', bn: 'Rangamati', lat: 22.6533, lng: 92.1753, area: 'Rangamati', city: 'রাঙ্গামাটি' },
    { name: 'খাগড়াছড়ি', bn: 'Khagrachhari', lat: 23.1193, lng: 91.9847, area: 'Khagrachhari', city: 'খাগড়াছড়ি' },
    { name: 'সাজেক', bn: 'Sajek', lat: 23.3820, lng: 92.2938, area: 'Sajek Valley', city: 'রাঙ্গামাটি' },
    { name: 'নেত্রকোনা', bn: 'Netrokona', lat: 24.8837, lng: 90.7289, area: 'Netrokona Sadar', city: 'নেত্রকোনা' },
    { name: 'কিশোরগঞ্জ', bn: 'Kishoreganj', lat: 24.4449, lng: 90.7766, area: 'Gaital', city: 'কিশোরগঞ্জ' },
    { name: 'ব্রাহ্মণবাড়িয়া', bn: 'Brahmanbaria', lat: 23.9571, lng: 91.1119, area: 'Brahmanbaria', city: 'ব্রাহ্মণবাড়িয়া' },
    { name: 'ফরিদপুর', bn: 'Faridpur', lat: 23.6071, lng: 89.8429, area: 'Goalchamot', city: 'ফরিদপুর' },
    { name: 'গোপালগঞ্জ', bn: 'Gopalganj', lat: 23.0051, lng: 89.8266, area: 'Police Line', city: 'গোপালগঞ্জ' },
    { name: 'মাদারীপুর', bn: 'Madaripur', lat: 23.1641, lng: 90.1897, area: 'Madaripur Sadar', city: 'মাদারীপুর' },
    { name: 'চাঁপাইনবাবগঞ্জ', bn: 'Chapainawabganj', lat: 24.5965, lng: 88.2775, area: 'Sadar', city: 'চাঁপাইনবাবগঞ্জ' },
    { name: 'পঞ্চগড়', bn: 'Panchagarh', lat: 26.3411, lng: 88.5542, area: 'Panchagarh', city: 'পঞ্চগড়' },
    { name: 'তেঁতুলিয়া', bn: 'Tetulia', lat: 26.4950, lng: 88.3512, area: 'Tetulia', city: 'পঞ্চগড়' },
    { name: 'সাতক্ষীরা', bn: 'Satkhira', lat: 22.7185, lng: 89.0705, area: 'Satkhira Sadar', city: 'সাতক্ষীরা' },
    { name: 'নওগাঁ', bn: 'Naogaon', lat: 24.7937, lng: 88.9318, area: 'Naogaon Sadar', city: 'নওগাঁ' },
    { name: 'সিরাজগঞ্জ', bn: 'Sirajganj', lat: 24.4534, lng: 89.7008, area: 'Bazar', city: 'সিরাজগঞ্জ' },
    { name: 'নাটোর', bn: 'Natore', lat: 24.4206, lng: 89.0003, area: 'Harishpur', city: 'নাটোর' },
    { name: 'জামালপুর', bn: 'Jamalpur', lat: 24.9375, lng: 89.9378, area: 'Jamalpur', city: 'জামালপুর' },
    { name: 'শেরপুর', bn: 'Sherpur', lat: 25.0205, lng: 90.0153, area: 'Sherpur', city: 'শেরপুর' },
    { name: 'চাঁদপুর', bn: 'Chandpur', lat: 23.2333, lng: 90.6667, area: 'Bus Stand', city: 'চাঁদপুর' },
    { name: 'লক্ষ্মীপুর', bn: 'Lakshmipur', lat: 22.9425, lng: 90.8412, area: 'Lakshmipur', city: 'লক্ষ্মীপুর' },
    { name: 'পিরোজপুর', bn: 'Pirojpur', lat: 22.5841, lng: 89.9720, area: 'Pirojpur', city: 'পিরোজপুর' },
    { name: 'পটুয়াখালী', bn: 'Patuakhali', lat: 22.3596, lng: 90.3299, area: 'Patuakhali', city: 'পটুয়াখালী' },
    { name: 'বাগেরহাট', bn: 'Bagerhat', lat: 22.6516, lng: 89.7859, area: 'Bagerhat', city: 'বাগেরহাট' },
    { name: 'মেহেরপুর', bn: 'Meherpur', lat: 23.7622, lng: 88.6318, area: 'Meherpur', city: 'মেহেরপুর' },
    { name: 'চুয়াডাঙ্গা', bn: 'Chuadanga', lat: 23.6402, lng: 88.8418, area: 'Chuadanga', city: 'চুয়াডাঙ্গা' },
    { name: 'ঝিনাইদহ', bn: 'Jhenaidah', lat: 23.5450, lng: 89.1726, area: 'Jhenaidah', city: 'ঝিনাইদহ' },
    { name: 'মাগুরা', bn: 'Magura', lat: 23.4873, lng: 89.4198, area: 'Magura', city: 'মাগুরা' },
    { name: 'নড়াইল', bn: 'Narail', lat: 23.1725, lng: 89.5127, area: 'Narail', city: 'নড়াইল' },
    { name: 'শরীয়তপুর', bn: 'Shariatpur', lat: 23.2423, lng: 90.4348, area: 'Shariatpur', city: 'শরীয়তপুর' }
  ];
  stopList.forEach(s => {
    const doc = { _id: detId('st'), ...s, isActive: true };
    db.stops.push(doc);
  });

  // ========== FARES (Current BRTA Approved Rates & Rules) ==========
  db.fares.push(
    // Dhaka & Chattogram Metropolitan: 2.50 TK/km (min 10 TK, Student 50% discount = 5 TK)
    { _id: detId('fare'), category: 'dhaka_city', busType: 'non_ac', baseFare: 10, perKmRate: 2.50, minFare: 10, peakHourMultiplier: 1.15, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'dhaka_city', busType: 'ac', baseFare: 10, perKmRate: 4.10, minFare: 20, peakHourMultiplier: 1.2, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    // Dhaka Metropolitan Suburbs & DTCA: 2.40 TK/km
    { _id: detId('fare'), category: 'dtca', busType: 'non_ac', baseFare: 10, perKmRate: 2.40, minFare: 10, peakHourMultiplier: 1.15, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'dtca', busType: 'ac', baseFare: 10, perKmRate: 3.90, minFare: 20, peakHourMultiplier: 1.2, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    // Long-Distance / Inter-District Highway: 2.15 TK/km (51-seat standard)
    { _id: detId('fare'), category: 'intercity', busType: 'non_ac', baseFare: 10, perKmRate: 2.15, minFare: 15, peakHourMultiplier: 1.1, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'intercity', busType: 'ac', baseFare: 10, perKmRate: 3.60, minFare: 30, peakHourMultiplier: 1.15, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'long_route', busType: 'non_ac', baseFare: 10, perKmRate: 2.15, minFare: 20, peakHourMultiplier: 1.1, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'long_route', busType: 'ac', baseFare: 10, perKmRate: 3.80, minFare: 40, peakHourMultiplier: 1.15, studentDiscount: 0.5, isActive: true, createdAt: new Date() },
    { _id: detId('fare'), category: 'long_route', busType: 'sleeper', baseFare: 10, perKmRate: 5.10, minFare: 50, peakHourMultiplier: 1.2, studentDiscount: 0.5, isActive: true, createdAt: new Date() }
  );

  // Helper string extractors
  function extractBn(str) {
    if (!str) return '';
    const m = str.match(/\(([^)]+)\)/);
    return m ? m[1].trim() : str.trim();
  }
  function extractEn(str) {
    if (!str) return '';
    const m = str.split('(')[0];
    return m ? m.trim() : str.trim();
  }

  // ========== SEED ROUTES & BUSES ==========
  dhakaRoutesData.forEach((rd, idx) => {
    const fromBn = extractBn(rd.stops[0]);
    const toBn = extractBn(rd.stops[rd.stops.length - 1]);
    const fromEn = extractEn(rd.stops[0]);
    const toEn = extractEn(rd.stops[rd.stops.length - 1]);
    const routeBnName = extractBn(rd.name);
    const routeEnName = extractEn(rd.name);

    const routeObj = {
      _id: rd.id,
      name: routeBnName,
      en: routeEnName,
      from: fromBn,
      to: toBn,
      fromEn: fromEn,
      toEn: toEn,
      category: rd.category || 'dhaka_city',
      distance: rd.distance,
      estimatedTime: rd.estimatedTime,
      busStops: rd.stops.map((s, i) => ({
        name: extractBn(s),
        en: extractEn(s),
        displayName: s,
        order: i + 1,
        distance: Math.round(rd.distance * (i + 1) / rd.stops.length)
      })),
      buses: [],
      trafficStatus: rd.trafficLevel || 'medium',
      isActive: true,
      searchCount: 300 - idx,
      createdAt: new Date(),
      description: `${routeBnName} - দূরত্ব: ${rd.distance} কি.মি, আনুমানিক সময়: ${rd.estimatedTime} মিনিট`,
      popular: idx < 15 || rd.category === 'long_route',
      fareRange: {
        min: rd.fare.regular,
        max: rd.fare.sleeper || rd.fare.ac || rd.fare.regular,
        regular: rd.fare.regular,
        student: Math.max(5, Math.round(rd.fare.regular * 0.5)),
        ac: rd.fare.ac,
        sleeper: rd.fare.sleeper || null
      }
    };
    db.routes.push(routeObj);

    // Auto-generate realistic buses
    const busNames = Array.isArray(rd.buses) ? rd.buses : [routeBnName];
    busNames.forEach((bName, bi) => {
      const op = db.operators.find(o => o.name === bName || o.shortName === bName);
      const opId = op ? op._id : null;
      const opName = op ? op.name : bName;

      // Non-AC bus
      const bus1 = {
        _id: detId('bus'),
        name: `${bName} (নন-এসি)`,
        en: `${bName} (Non-AC)`,
        operator: opId,
        operatorName: opName,
        type: 'non_ac',
        route: routeObj._id,
        fare: rd.fare.regular,
        studentFare: Math.max(5, Math.round(rd.fare.regular * 0.5)),
        seatCapacity: rd.category === 'dhaka_city' ? 50 : 52,
        departureTime: '০৬:০০ - ২৩:০০ (প্রতি ১০ মিনিট পর)',
        amenities: ['আরামদায়ক আসন', 'ফ্যান'],
        image: '',
        isActive: true,
        createdAt: new Date()
      };
      db.buses.push(bus1);
      routeObj.buses.push(bus1._id);

      // AC bus
      if (rd.fare.ac) {
        const bus2 = {
          _id: detId('bus'),
          name: `${bName} (এসি চেয়ার কোচ)`,
          en: `${bName} (AC Chair Coach)`,
          operator: opId,
          operatorName: opName,
          type: 'ac',
          route: routeObj._id,
          fare: rd.fare.ac,
          studentFare: Math.round(rd.fare.ac * 0.5),
          seatCapacity: rd.category === 'dhaka_city' ? 40 : 36,
          departureTime: '০৭:০০, ১০:৩০, ১৫:০০, ২১:০০',
          amenities: ['এসি', 'মোবাইল চার্জিং পোর্ট', 'মিনারেল ওয়াটার'],
          image: '',
          isActive: true,
          createdAt: new Date()
        };
        db.buses.push(bus2);
        routeObj.buses.push(bus2._id);
      }

      // Sleeper bus (if long route / sleeper fare provided)
      if (rd.fare.sleeper) {
        const bus3 = {
          _id: detId('bus'),
          name: `${bName} (লাক্সারি স্লিপার কোচ)`,
          en: `${bName} (Luxury Sleeper Coach)`,
          operator: opId,
          operatorName: opName,
          type: 'sleeper',
          route: routeObj._id,
          fare: rd.fare.sleeper,
          studentFare: Math.round(rd.fare.sleeper * 0.5),
          seatCapacity: 28,
          departureTime: '২২:০০, ২৩:৩০ (নাইট কোচ)',
          amenities: ['এসি', 'স্লিপার বেড', 'কম্বল ও বালিশ', 'মিনারেল ওয়াটার', 'ওয়াইফাই', 'চার্জিং পোর্ট'],
          image: '',
          isActive: true,
          createdAt: new Date()
        };
        db.buses.push(bus3);
        routeObj.buses.push(bus3._id);
      }
    });
  });

  // ========== ANNOUNCEMENTS ==========
  db.announcements.push(
    { _id: detId('ann'), title: '🚌 গন্তব্য BD তে স্বাগতম!', message: '১৬০+ বাস রুট, ২৫০+ বাস সার্ভিস ও ৬৪ জেলার আন্তঃজেলা বাস তথ্য এখন এক ক্লিকে।', type: 'general', isActive: true, createdAt: new Date() },
    { _id: detId('ann'), title: '🎓 স্টুডেন্ট হাফ পাস ৫০% ছাড়!', message: 'সকল নিয়মিত শিক্ষার্থীদের জন্য বাসের ভাড়ায় ৫০% হাফ পাস কার্যকর রয়েছে। আইডি কার্ড সাথে রাখুন।', type: 'tips', isActive: true, createdAt: new Date() },
    { _id: detId('ann'), title: '🛣️ ঢাকা-চট্টগ্রাম ও পদ্মা সেতু লং রুট', message: 'ঢাকা থেকে চট্টগ্রাম, কক্সবাজার, খুলনা, বরিশাল, সিলেটসহ সব বিভাগীয় শহরের এসি ও স্লিপার কোচের সময়সূচী যুক্ত হয়েছে।', type: 'general', isActive: true, createdAt: new Date() },
    { _id: detId('ann'), title: '🚦 লাইভ ট্রাফিক সতর্কতা: ফার্মগেট ও মালিবাগ', message: 'পিক আওয়ারে ফার্মগেট, কাওরান বাজার ও মালিবাগ মোড়ে তীব্র যানজট হতে পারে। বিকল্প রুট ব্যবহার করুন।', type: 'traffic', isActive: true, createdAt: new Date() },
    { _id: detId('ann'), title: '💡 বিআরটিসি ২০২৬ নতুন ভাড়া তালিকা', message: 'বিআরটিসি ও অন্যান্য আন্তঃজেলা বাসে কিলোমিটারে সরকারি অনুমোদিত হারে ভাড়া গণনা করা হচ্ছে।', type: 'tips', isActive: true, createdAt: new Date() }
  );
}

function getDb() { return db; }
const Fare = { findById(id) { const d = db.fares.find(x => x._id === id); return Promise.resolve(d ? new Doc(d, 'fares') : null); } };
module.exports = { User, Route, Bus, Fare, seedDatabase, getDb, resetIdCounter };
