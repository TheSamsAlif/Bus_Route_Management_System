const crypto = require('crypto');
const dhakaRoutesData = require('./dhakaRoutes');
function id() { return crypto.randomBytes(12).toString('hex'); }

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

  // ========== USERS ==========
  db.users.push(
    { _id: id(), username: 'admin', name: 'Admin', email: 'admin@bd.com', password: 'admin123_hashed', role: 'admin', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: id(), username: 'user', name: 'Shamim Hasan', email: 'user@bd.com', password: 'user123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: id(), username: 'sams', name: 'Sams Alif', email: 'sams@bd.com', password: 'sams123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() },
    { _id: id(), username: 'passenger', name: 'Rafiq Hasan', email: 'rafiq@bd.com', password: 'pass123_hashed', role: 'user', language: 'bn', darkMode: false, favorites: [], searchHistory: [], createdAt: new Date() }
  );

  // ========== OPERATORS ==========
  const operators = [
    { _id: id(), name: 'বিআরটিসি', shortName: 'BRTC', city: 'ঢাকা', type: 'government', phone: '০২-৯৩৫১২৩৪', website: 'brtc.gov.bd', isActive: true },
    { _id: id(), name: 'আজমেরী গ্লোরী', shortName: 'Azmeri Glory', city: 'ঢাকা', type: 'private', phone: '০১৭১১-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'গাজীপুর পরিবহন', shortName: 'Gazipur Paribahan', city: 'গাজীপুর', type: 'private', phone: '০১৭১২-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'স্কাইলাইন', shortName: 'Skyline', city: 'ঢাকা', type: 'private', phone: '০১৭১৩-৪৫৬৭৮৯', isActive: true },
    { _id: id(), name: 'ভিআইপি ২৭', shortName: 'VIP 27', city: 'ঢাকা', type: 'private', phone: '০১৭১৪-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'তুরাগ পরিবহন', shortName: 'Turag', city: 'ঢাকা', type: 'private', phone: '০১৭১৫-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'আনabil পরিবহন', shortName: 'Anabil', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭১৬-৩৪৫৬৭৮', isActive: true },
    { _id: id(), name: 'হিমাচল', shortName: 'Himachal', city: 'ঢাকা', type: 'private', phone: '০১৭১৭-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'বাসুমতি', shortName: 'Basumati', city: 'গাজীপুর', type: 'private', phone: '০১৭১৮-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'ভিক্টর ক্লাসিক', shortName: 'Victor Classic', city: 'ঢাকা', type: 'private', phone: '০১৭১৯-৪৫৬৭৮৯', isActive: true },
    { _id: id(), name: 'গ্রামীণ পরিবহন', shortName: 'Grameen', city: 'টঙ্গী', type: 'private', isActive: true },
    { _id: id(), name: 'বন্ধন পরিবহন', shortName: 'Bondhon', city: 'সাভার', type: 'private', isActive: true },
    { _id: id(), name: 'উৎসব পরিবহন', shortName: 'Utshob', city: 'মিরপুর', type: 'private', isActive: true },
    { _id: id(), name: 'ডলনচাপা', shortName: 'Dolonchapa', city: 'নারায়ণগঞ্জ', type: 'private', isActive: true },
    { _id: id(), name: 'নারায়ণগঞ্জ পরিবহন', shortName: 'Narayanganj Paribahan', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭২০-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'গ্রীন লাইন', shortName: 'Green Line', city: 'ঢাকা', type: 'private', phone: '০১৭২১-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'হানিফ এন্টারপ্রাইজ', shortName: 'Hanif', city: 'ঢাকা', type: 'private', phone: '০১৭২২-৩৪৫৬৭৮', isActive: true },
    { _id: id(), name: 'সৌদিয়া পরিবহন', shortName: 'Soudia', city: 'ঢাকা', type: 'private', phone: '০১৭২৩-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'নাবিল পরিবহন', shortName: 'Nabil', city: 'ঢাকা', type: 'private', phone: '০১৭২৪-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'সেন্ট মার্টিন', shortName: 'Saint Martin', city: 'ঢাকা', type: 'private', phone: '০১৭২৫-৪৫৬৭৮৯', isActive: true },
    { _id: id(), name: 'শ্যামলী পরিবহন', shortName: 'Shyamoli', city: 'ঢাকা', type: 'private', phone: '০১৭২৬-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'এনা ট্রান্সপোর্ট', shortName: 'Ena', city: 'ঢাকা', type: 'private', phone: '০১৭২৭-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'কেয়া পরিবহন', shortName: 'Keya', city: 'ঢাকা', type: 'private', phone: '০১৭২৮-৩৪৫৬৭৮', isActive: true },
    { _id: id(), name: 'এ আর ট্রাভেলস', shortName: 'AR Travels', city: 'ঢাকা', type: 'private', phone: '০১৭২৯-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'সোহাগ পরিবহন', shortName: 'Shohagh', city: 'ঢাকা', type: 'private', phone: '০১৭৩০-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'শীতল পরিবহন', shortName: 'Shitol', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩১-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'বাঁধন পরিবহন', shortName: 'Badhon', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩২-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'একতা পরিবহন', shortName: 'Ekota', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৩-৪৫৬৭৮৯', isActive: true },
    { _id: id(), name: 'উল্লাস পরিবহন', shortName: 'Ullash', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৪-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'উৎসব পরিবহন', shortName: 'Utshob', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৫-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'বন্ধন পরিবহন', shortName: 'Bondhon', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৬-৩৪৫৬৭৮', isActive: true },
    { _id: id(), name: 'স্বদেশ পরিবহন', shortName: 'Shodesh', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৭-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'দোয়েল পরিবহন', shortName: 'Doel', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৮-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'আসিয়ান পরিবহন', shortName: 'Asian', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৩৯-৪৫৬৭৮৯', isActive: true },
    { _id: id(), name: 'আনন্দ পরিবহন', shortName: 'Ananda', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৪০-১২৩৪৫৬', isActive: true },
    { _id: id(), name: 'সেতু পরিবহন', shortName: 'Setu', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৪১-৭৮৯০১২', isActive: true },
    { _id: id(), name: 'বোরাক পরিবহন', shortName: 'Borak', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৪২-৩৪৫৬৭৮', isActive: true },
    { _id: id(), name: 'প্রভাতী বনশ্রী', shortName: 'Provati Bonshree', city: 'নারায়ণগঞ্জ', type: 'private', phone: '০১৭৪৩-১২৩৪৫৬', isActive: true },
  ];
  operators.forEach(o => db.operators.push({ ...o }));

  // ========== STOPS (50+ major stops with approximate coordinates) ==========
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
    { name: 'বারিধারা', bn: 'Baridhara', lat: 23.7950, lng: 90.4150, area: 'Baridhara', city: 'ঢাকা' },
    { name: 'কুড়িল', bn: 'Kuril', lat: 23.8000, lng: 90.4200, area: 'Kuril', city: 'ঢাকা' },
    { name: 'বাড্ডা', bn: 'Badda', lat: 23.7850, lng: 90.4250, area: 'Badda', city: 'ঢাকা' },
    { name: 'রামপুরা', bn: 'Rampura', lat: 23.7750, lng: 90.4300, area: 'Rampura', city: 'ঢাকা' },
    { name: 'মালিবাগ', bn: 'Malibagh', lat: 23.7600, lng: 90.4250, area: 'Malibagh', city: 'ঢাকা' },
    { name: 'মৌচাক', bn: 'Mouchak', lat: 23.7500, lng: 90.4200, area: 'Mouchak', city: 'ঢাকা' },
    { name: 'যাত্রাবাড়ী', bn: 'Jatrabari', lat: 23.7100, lng: 90.4300, area: 'Jatrabari', city: 'ঢাকা' },
    { name: 'সাইনবোর্ড', bn: 'Signboard', lat: 23.6900, lng: 90.4350, area: 'Signboard', city: 'ঢাকা' },
    { name: 'চাষাড়া', bn: 'Chashara', lat: 23.6700, lng: 90.4400, area: 'Chashara', city: 'নারায়ণগঞ্জ' },
    { name: 'নারায়ণগঞ্জ', bn: 'Narayanganj', lat: 23.6200, lng: 90.5000, area: 'Narayanganj Sadar', city: 'নারায়ণগঞ্জ' },
    { name: 'পোস্তা', bn: 'Posta', lat: 23.6900, lng: 90.4450, area: 'Posta', city: 'ঢাকা' },
    { name: 'কামরাঙ্গীরচর', bn: 'Kamrangirchar', lat: 23.7000, lng: 90.4100, area: 'Kamrangirchar', city: 'ঢাকা' },
    { name: 'সদরঘাট', bn: 'Sadarghat', lat: 23.7060, lng: 90.4050, area: 'Sadarghat', city: 'ঢাকা' },
    { name: 'ধানমন্ডি', bn: 'Dhanmondi', lat: 23.7450, lng: 90.3800, area: 'Dhanmondi', city: 'ঢাকা' },
    { name: 'মিরপুর ১', bn: 'Mirpur 1', lat: 23.7800, lng: 90.3600, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'মিরপুর ১০', bn: 'Mirpur 10', lat: 23.7900, lng: 90.3650, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'মিরপুর ১২', bn: 'Mirpur 12', lat: 23.8000, lng: 90.3550, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'পল্লবী', bn: 'Pallabi', lat: 23.8100, lng: 90.3500, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'উত্তরা', bn: 'Uttara', lat: 23.8750, lng: 90.3850, area: 'Uttara', city: 'ঢাকা' },
    { name: 'হাউজ বিল্ডিং', bn: 'House Building', lat: 23.8400, lng: 90.3700, area: 'Uttara', city: 'ঢাকা' },
    { name: 'বিমানবন্দর', bn: 'Airport', lat: 23.8500, lng: 90.4000, area: 'Airport', city: 'ঢাকা' },
    { name: 'টঙ্গী', bn: 'Tongi', lat: 23.8900, lng: 90.4050, area: 'Tongi', city: 'গাজীপুর' },
    { name: 'গাজীপুর চৌরাস্তা', bn: 'Gazipur Chourasta', lat: 23.9900, lng: 90.4200, area: 'Gazipur Sadar', city: 'গাজীপুর' },
    { name: 'গাজীপুর', bn: 'Gazipur', lat: 24.0000, lng: 90.4300, area: 'Gazipur Sadar', city: 'গাজীপুর' },
    { name: 'বোর্ড বাজার', bn: 'Board Bazar', lat: 23.9400, lng: 90.4100, area: 'Gazipur', city: 'গাজীপুর' },
    { name: 'মৌনা', bn: 'Mawna', lat: 24.0500, lng: 90.4400, area: 'Sreepur', city: 'গাজীপুর' },
    { name: 'সাভার', bn: 'Savar', lat: 23.8580, lng: 90.2670, area: 'Savar', city: 'ঢাকা' },
    { name: 'আশুলিয়া', bn: 'Ashulia', lat: 23.9000, lng: 90.3200, area: 'Ashulia', city: 'ঢাকা' },
    { name: 'নবীনগর', bn: 'Nabinagar', lat: 23.8800, lng: 90.3000, area: 'Savar', city: 'ঢাকা' },
    { name: 'ঢাকা', bn: 'Dhaka', lat: 23.7104, lng: 90.4074, area: 'Dhaka', city: 'ঢাকা' },
    { name: 'কেরানীগঞ্জ', bn: 'Keraniganj', lat: 23.6800, lng: 90.3600, area: 'Keraniganj', city: 'ঢাকা' },
    { name: 'ডেমরা', bn: 'Demra', lat: 23.7200, lng: 90.4800, area: 'Demra', city: 'ঢাকা' },
    { name: 'সায়েদাবাদ', bn: 'Sayedabad', lat: 23.7200, lng: 90.4350, area: 'Jatrabari', city: 'ঢাকা' },
    { name: 'কমলাপুর', bn: 'Kamalapur', lat: 23.7310, lng: 90.4250, area: 'Motijheel', city: 'ঢাকা' },
    { name: 'মোহাম্মদপুর', bn: 'Mohammadpur', lat: 23.7600, lng: 90.3500, area: 'Mohammadpur', city: 'ঢাকা' },
    { name: 'লালমাটিয়া', bn: 'Lalmatia', lat: 23.7500, lng: 90.3650, area: 'Mohammadpur', city: 'ঢাকা' },
    { name: 'ইস্কাটন', bn: 'Eskaton', lat: 23.7400, lng: 90.4000, area: 'Eskaton', city: 'ঢাকা' },
    { name: 'কাকরাইল', bn: 'Kakrail', lat: 23.7370, lng: 90.4030, area: 'Shahbagh', city: 'ঢাকা' },
    { name: 'টিকাটুলী', bn: 'Tikatuli', lat: 23.7250, lng: 90.4120, area: 'Motijheel', city: 'ঢাকা' },
    { name: 'আরামবাগ', bn: 'Arambagh', lat: 23.7200, lng: 90.4150, area: 'Motijheel', city: 'ঢাকা' },
    { name: 'মানিকগঞ্জ', bn: 'Manikganj', lat: 23.8500, lng: 90.0000, area: 'Manikganj', city: 'মানিকগঞ্জ' },
    { name: 'টেকনিক্যাল', bn: 'Technical', lat: 23.7700, lng: 90.3770, area: 'Agargaon', city: 'ঢাকা' },
    { name: 'কল্যাণপুর', bn: 'Kallyanpur', lat: 23.7800, lng: 90.3400, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'সেনপাড়া', bn: 'Senpara', lat: 23.8100, lng: 90.3650, area: 'Mirpur', city: 'ঢাকা' },
    { name: 'বসুন্ধরা', bn: 'Bashundhara', lat: 23.8050, lng: 90.4300, area: 'Badda', city: 'ঢাকা' },
    { name: 'নিকুঞ্জ', bn: 'Nikunja', lat: 23.8200, lng: 90.4200, area: 'Khilkhet', city: 'ঢাকা' },
    { name: 'খিলখেত', bn: 'Khilkhet', lat: 23.8300, lng: 90.4150, area: 'Khilkhet', city: 'ঢাকা' },
    { name: 'বিমান সংগীত', bn: 'Biman Sangit', lat: 23.8400, lng: 90.4100, area: 'Airport', city: 'ঢাকা' },
  ];
  const stopMap = {};
  stopList.forEach(s => {
    const doc = { _id: id(), ...s, isActive: true };
    db.stops.push(doc);
    stopMap[s.name] = doc._id;
  });

  // ========== TRAFFIC DATA ==========
  const trafficAreas = [
    { area: 'ফার্মগেট', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'high', night: 'low' },
    { area: 'যাত্রাবাড়ী', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'very_high', night: 'low' },
    { area: 'মতিঝিল', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'very_high', night: 'low' },
    { area: 'গুলশান', dayType: 'weekday', morning: 'medium', afternoon: 'medium', evening: 'high', night: 'low' },
    { area: 'মিরপুর ১০', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'high', night: 'low' },
    { area: 'শাহবাগ', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'high', night: 'low' },
    { area: 'উত্তরা', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'medium', night: 'low' },
    { area: 'টঙ্গী', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'medium', night: 'low' },
    { area: 'গাজীপুর', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'medium', night: 'low' },
    { area: 'বিমানবন্দর', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'medium', night: 'low' },
    { area: 'কুড়িল', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'high', night: 'low' },
    { area: 'বাড্ডা', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'high', night: 'low' },
    { area: 'সাভার', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'medium', night: 'low' },
    { area: 'নারায়ণগঞ্জ', dayType: 'weekday', morning: 'high', afternoon: 'medium', evening: 'high', night: 'low' },
    { area: 'মোহাম্মদপুর', dayType: 'weekday', morning: 'medium', afternoon: 'low', evening: 'medium', night: 'low' },
  ];
  trafficAreas.forEach(t => {
    db.traffic_data.push({ _id: id(), ...t, lastUpdated: new Date(), isActive: true });
  });

  // ========== FARES ==========
  db.fares.push(
    // Dhaka & Chattogram City (Metropolitan): 2.53 TK/km
    { _id: id(), category: 'dhaka_city', busType: 'non_ac', baseFare: 10, perKmRate: 2.53, minFare: 10, peakHourMultiplier: 1.15, studentDiscount: 0, isActive: true, createdAt: new Date() },
    { _id: id(), category: 'dhaka_city', busType: 'ac', baseFare: 10, perKmRate: 4.05, minFare: 10, peakHourMultiplier: 1.2, studentDiscount: 0, isActive: true, createdAt: new Date() },
    // Long-Distance / Inter-District: 2.23 TK/km (51-seat bus)
    { _id: id(), category: 'intercity', busType: 'non_ac', baseFare: 10, perKmRate: 2.23, minFare: 10, peakHourMultiplier: 1.1, studentDiscount: 0, isActive: true, createdAt: new Date() },
    { _id: id(), category: 'intercity', busType: 'ac', baseFare: 10, perKmRate: 3.57, minFare: 10, peakHourMultiplier: 1.2, studentDiscount: 0, isActive: true, createdAt: new Date() },
    // Long Route / Inter-District: same rate as intercity
    { _id: id(), category: 'long_route', busType: 'non_ac', baseFare: 10, perKmRate: 2.23, minFare: 10, peakHourMultiplier: 1.1, studentDiscount: 0, isActive: true, createdAt: new Date() },
    { _id: id(), category: 'long_route', busType: 'ac', baseFare: 10, perKmRate: 3.57, minFare: 10, peakHourMultiplier: 1.2, studentDiscount: 0, isActive: true, createdAt: new Date() },
    { _id: id(), category: 'long_route', busType: 'sleeper', baseFare: 10, perKmRate: 4.46, minFare: 10, peakHourMultiplier: 1.25, studentDiscount: 0, isActive: true, createdAt: new Date() },
    // DTCA Area (Dhaka surrounding): 2.43 TK/km
    { _id: id(), category: 'dtca', busType: 'non_ac', baseFare: 10, perKmRate: 2.43, minFare: 10, peakHourMultiplier: 1.15, studentDiscount: 0, isActive: true, createdAt: new Date() },
    { _id: id(), category: 'dtca', busType: 'ac', baseFare: 10, perKmRate: 3.89, minFare: 10, peakHourMultiplier: 1.2, studentDiscount: 0, isActive: true, createdAt: new Date() }
  );

  // ========== ROUTES (60+ routes) ==========
  const r = {};

  function createRoute(key, data) {
    const stops = data.stops.map((s, i) => ({
      name: s, order: i + 1,
      distance: Math.round(data.dist * (i + 1) / data.stops.length)
    }));
    const routeObj = {
      _id: id(), name: data.name, from: data.from, to: data.to,
      category: data.cat, distance: data.dist, estimatedTime: data.time,
      busStops: stops, buses: [], trafficStatus: data.traf,
      isActive: true, searchCount: data.cnt || 100, createdAt: new Date(),
      description: data.desc || '',
      hasAlternateRoutes: data.alt || false,
      popular: data.pop || false,
      isExpress: data.express || false,
      fareRange: data.fareRange || { min: 10, max: 30 }
    };
    db.routes.push(routeObj);
    r[key] = routeObj;
    return routeObj;
  }

  // ---- DHAKA CITY ROUTES (30 routes) ----
  createRoute('r1', { name:'গুলিস্তান-মতিঝিল', from:'গুলিস্তান', to:'মতিঝিল', cat:'dhaka_city', dist:5, time:20, stops:['গুলিস্তান','পল্টন','মতিঝিল'], traf:'high', cnt:500, pop:true, fareRange:{min:10,max:20} });
  createRoute('r2', { name:'মতিঝিল-শাহবাগ', from:'মতিঝিল', to:'শাহবাগ', cat:'dhaka_city', dist:4, time:15, stops:['মতিঝিল','পল্টন','কাকরাইল','শাহবাগ'], traf:'medium', cnt:450, pop:true });
  createRoute('r3', { name:'ফার্মগেট-মিরপুর ১২', from:'ফার্মগেট', to:'মিরপুর ১২', cat:'dhaka_city', dist:10, time:40, stops:['ফার্মগেট','কাওরান বাজার','শ্যামলী','পল্লবী','মিরপুর ১০','মিরপুর ১২'], traf:'high', cnt:480, pop:true, fareRange:{min:20,max:40} });
  createRoute('r4', { name:'উত্তরা-সদরঘাট', from:'উত্তরা', to:'সদরঘাট', cat:'dhaka_city', dist:20, time:75, stops:['উত্তরা','হাউজ বিল্ডিং','মিরপুর ১২','শ্যামলী','আগারগাঁও','বিজয় সরণি','শাহবাগ','সদরঘাট'], traf:'high', cnt:420, pop:true });
  createRoute('r5', { name:'মোহাম্মদপুর-গুলশান', from:'মোহাম্মদপুর', to:'গুলশান', cat:'dhaka_city', dist:14, time:50, stops:['মোহাম্মদপুর','লালমাটিয়া','শ্যামলী','আগারগাঁও','বিজয় সরণি','মহাখালী','বনানী','গুলশান'], traf:'medium', cnt:350, pop:true });
  createRoute('r6', { name:'সাভার-যাত্রাবাড়ী', from:'সাভার', to:'যাত্রাবাড়ী', cat:'dhaka_city', dist:28, time:95, stops:['সাভার','আশুলিয়া','নবীনগর','ধানমন্ডি','শাহবাগ','কমলাপুর','যাত্রাবাড়ী'], traf:'medium', cnt:300, pop:true, fareRange:{min:30,max:60} });
  createRoute('r7', { name:'ধানমন্ডি-কামরাঙ্গীরচর', from:'ধানমন্ডি', to:'কামরাঙ্গীরচর', cat:'dhaka_city', dist:10, time:35, stops:['ধানমন্ডি','লালমাটিয়া','নিউমার্কেট','সদরঘাট','কামরাঙ্গীরচর'], traf:'high', cnt:280 });
  createRoute('r8', { name:'বনানী-যাত্রাবাড়ী', from:'বনানী', to:'যাত্রাবাড়ী', cat:'dhaka_city', dist:15, time:55, stops:['বনানী','মহাখালী','ফার্মগেট','শাহবাগ','কমলাপুর','যাত্রাবাড়ী'], traf:'high', cnt:260 });
  createRoute('r9', { name:'রামপুরা-শাহবাগ', from:'রামপুরা', to:'শাহবাগ', cat:'dhaka_city', dist:7, time:25, stops:['রামপুরা','মালিবাগ','মৌচাক','সায়েদাবাদ','যাত্রাবাড়ী','কমলাপুর','শাহবাগ'], traf:'medium', cnt:240 });
  createRoute('r10', { name:'বাড্ডা-শ্যামলী', from:'বাড্ডা', to:'শ্যামলী', cat:'dhaka_city', dist:12, time:45, stops:['বাড্ডা','গুলশান','বনানী','মহাখালী','বিজয় সরণি','শ্যামলী'], traf:'medium', cnt:220 });
  createRoute('r11', { name:'গুলশান-নারায়ণগঞ্জ', from:'গুলশান', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:22, time:65, stops:['গুলশান','বনানী','কুড়িল','যাত্রাবাড়ী','সাইনবোর্ড','চাষাড়া','নারায়ণগঞ্জ'], traf:'high', cnt:340, pop:true, fareRange:{min:30,max:70} });
  createRoute('r12', { name:'মতিঝিল-গাজীপুর', from:'মতিঝিল', to:'গাজীপুর', cat:'intercity', dist:32, time:85, stops:['মতিঝিল','ফার্মগেট','মহাখালী','বিমানবন্দর','টঙ্গী','বোর্ড বাজার','গাজীপুর চৌরাস্তা','গাজীপুর'], traf:'medium', cnt:310, pop:true, fareRange:{min:40,max:80} });
  createRoute('r13', { name:'সদরঘাট-নারায়ণগঞ্জ', from:'সদরঘাট', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:20, time:60, stops:['সদরঘাট','কামরাঙ্গীরচর','যাত্রাবাড়ী','সাইনবোর্ড','চাষাড়া','নারায়ণগঞ্জ'], traf:'high', cnt:290, pop:true });
  createRoute('r14', { name:'যাত্রাবাড়ী-নারায়ণগঞ্জ', from:'যাত্রাবাড়ী', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:15, time:40, stops:['যাত্রাবাড়ী','সাইনবোর্ড','চাষাড়া','নারায়ণগঞ্জ'], traf:'high', cnt:350, pop:true });
  createRoute('r15', { name:'মহাখালী-গাজীপুর', from:'মহাখালী', to:'গাজীপুর', cat:'intercity', dist:28, time:60, stops:['মহাখালী','বনানী','কুড়িল','বিমানবন্দর','টঙ্গী','গাজীপুর চৌরাস্তা','গাজীপুর'], traf:'medium', cnt:270, pop:true, fareRange:{min:35,max:70} });
  createRoute('r16', { name:'মিরপুর ১০-নারায়ণগঞ্জ', from:'মিরপুর ১০', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:28, time:90, stops:['মিরপুর ১০','শ্যামলী','আগারগাঁও','বিজয় সরণি','ধানমন্ডি','শাহবাগ','যাত্রাবাড়ী','নারায়ণগঞ্জ'], traf:'high', cnt:230 });
  createRoute('r17', { name:'টঙ্গী-সাভার', from:'টঙ্গী', to:'সাভার', cat:'dhaka_city', dist:20, time:55, stops:['টঙ্গী','গাজীপুর চৌরাস্তা','বোর্ড বাজার','আশুলিয়া','সাভার'], traf:'medium', cnt:200 });
  createRoute('r18', { name:'নারায়ণগঞ্জ-গাজীপুর', from:'নারায়ণগঞ্জ', to:'গাজীপুর', cat:'intercity', dist:38, time:95, stops:['নারায়ণগঞ্জ','চাষাড়া','সাইনবোর্ড','যাত্রাবাড়ী','ঢাকা','টঙ্গী','বোর্ড বাজার','গাজীপুর'], traf:'medium', cnt:190 });
  createRoute('r19', { name:'কেরানীগঞ্জ-মতিঝিল', from:'কেরানীগঞ্জ', to:'মতিঝিল', cat:'dhaka_city', dist:18, time:55, stops:['কেরানীগঞ্জ','যাত্রাবাড়ী','সায়েদাবাদ','কমলাপুর','পল্টন','মতিঝিল'], traf:'high', cnt:210 });
  createRoute('r20', { name:'ঢাকা-টঙ্গী', from:'ঢাকা', to:'টঙ্গী', cat:'intercity', dist:22, time:55, stops:['ঢাকা','মহাখালী','বিমানবন্দর','টঙ্গী'], traf:'medium', cnt:320, pop:true, fareRange:{min:30,max:50} });
  createRoute('r21', { name:'মতিঝিল-উত্তরা', from:'মতিঝিল', to:'উত্তরা', cat:'dhaka_city', dist:18, time:60, stops:['মতিঝিল','পল্টন','শাহবাগ','ফার্মগেট','বিজয় সরণি','মহাখালী','হাউজ বিল্ডিং','উত্তরা'], traf:'high', cnt:380, pop:true });
  createRoute('r22', { name:'গুলশান-মিরপুর ১০', from:'গুলশান', to:'মিরপুর ১০', cat:'dhaka_city', dist:12, time:40, stops:['গুলশান','বনানী','মহাখালী','বিজয় সরণি','শ্যামলী','মিরপুর ১০'], traf:'medium', cnt:310 });
  createRoute('r23', { name:'যাত্রাবাড়ী-উত্তরা', from:'যাত্রাবাড়ী', to:'উত্তরা', cat:'dhaka_city', dist:22, time:80, stops:['যাত্রাবাড়ী','কমলাপুর','শাহবাগ','ফার্মগেট','বিজয় সরণি','মহাখালী','হাউজ বিল্ডিং','উত্তরা'], traf:'high', cnt:290 });
  createRoute('r24', { name:'গাজীপুর-সাভার', from:'গাজীপুর', to:'সাভার', cat:'dhaka_city', dist:25, time:70, stops:['গাজীপুর','বোর্ড বাজার','টঙ্গী','আশুলিয়া','সাভার'], traf:'medium', cnt:180 });
  createRoute('r25', { name:'মিরপুর ১২-মতিঝিল', from:'মিরপুর ১২', to:'মতিঝিল', cat:'dhaka_city', dist:15, time:55, stops:['মিরপুর ১২','পল্লবী','শ্যামলী','আগারগাঁও','বিজয় সরণি','শাহবাগ','পল্টন','মতিঝিল'], traf:'high', cnt:330, pop:true });
  createRoute('r26', { name:'বাড্ডা-মতিঝিল', from:'বাড্ডা', to:'মতিঝিল', cat:'dhaka_city', dist:10, time:35, stops:['বাড্ডা','রামপুরা','মালিবাগ','মৌচাক','পল্টন','মতিঝিল'], traf:'medium', cnt:250 });
  createRoute('r27', { name:'উত্তরা-নারায়ণগঞ্জ', from:'উত্তরা', to:'নারায়ণগঞ্জ', cat:'intercity', dist:35, time:90, stops:['উত্তরা','বিমানবন্দর','কুড়িল','বনানী','যাত্রাবাড়ী','সাইনবোর্ড','নারায়ণগঞ্জ'], traf:'medium', cnt:210 });
  createRoute('r28', { name:'মোহাম্মদপুর-যাত্রাবাড়ী', from:'মোহাম্মদপুর', to:'যাত্রাবাড়ী', cat:'dhaka_city', dist:14, time:50, stops:['মোহাম্মদপুর','লালমাটিয়া','ধানমন্ডি','শাহবাগ','কমলাপুর','যাত্রাবাড়ী'], traf:'medium', cnt:200 });
  createRoute('r29', { name:'সাভার-উত্তরা', from:'সাভার', to:'উত্তরা', cat:'dhaka_city', dist:22, time:65, stops:['সাভার','আশুলিয়া','নবীনগর','মিরপুর ১২','পল্লবী','হাউজ বিল্ডিং','উত্তরা'], traf:'medium', cnt:190 });
  createRoute('r30', { name:'গাজীপুর-মিরপুর ১০', from:'গাজীপুর', to:'মিরপুর ১০', cat:'intercity', dist:25, time:65, stops:['গাজীপুর','বোর্ড বাজার','টঙ্গী','বিমানবন্দর','কুড়িল','বনানী','মহাখালী','শ্যামলী','মিরপুর ১০'], traf:'medium', cnt:230, pop:true });

  // ---- MORE DHAKA CITY ROUTES (15 more) ----
  createRoute('r31', { name:'শাহবাগ-টঙ্গী', from:'শাহবাগ', to:'টঙ্গী', cat:'intercity', dist:18, time:50, stops:['শাহবাগ','ফার্মগেট','মহাখালী','বিমানবন্দর','টঙ্গী'], traf:'medium', cnt:280, pop:true });
  createRoute('r32', { name:'কেরানীগঞ্জ-নারায়ণগঞ্জ', from:'কেরানীগঞ্জ', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:20, time:55, stops:['কেরানীগঞ্জ','যাত্রাবাড়ী','সাইনবোর্ড','নারায়ণগঞ্জ'], traf:'high', cnt:200 });
  createRoute('r33', { name:'গাজীপুর-ডেমরা', from:'গাজীপুর', to:'ডেমরা', cat:'intercity', dist:35, time:90, stops:['গাজীপুর','টঙ্গী','বিমানবন্দর','কুড়িল','বাড্ডা','যাত্রাবাড়ী','ডেমরা'], traf:'medium', cnt:150 });
  createRoute('r34', { name:'উত্তরা-কুড়িল', from:'উত্তরা', to:'কুড়িল', cat:'dhaka_city', dist:10, time:30, stops:['উত্তরা','হাউজ বিল্ডিং','বিমানবন্দর','নিকুঞ্জ','খিলখেত','কুড়িল'], traf:'medium', cnt:220 });
  createRoute('r35', { name:'সাভার-আশুলিয়া লোকাল', from:'সাভার', to:'আশুলিয়া', cat:'dhaka_city', dist:8, time:25, stops:['সাভার','নবীনগর','আশুলিয়া'], traf:'low', cnt:160 });
  createRoute('r36', { name:'মিরপুর ১০-বাড্ডা', from:'মিরপুর ১০', to:'বাড্ডা', cat:'dhaka_city', dist:14, time:45, stops:['মিরপুর ১০','শ্যামলী','আগারগাঁও','বিজয় সরণি','মহাখালী','বনানী','গুলশান','বাড্ডা'], traf:'medium', cnt:240 });
  createRoute('r37', { name:'বনানী-টঙ্গী', from:'বনানী', to:'টঙ্গী', cat:'intercity', dist:12, time:35, stops:['বনানী','কুড়িল','বিমানবন্দর','টঙ্গী'], traf:'medium', cnt:260, pop:true });
  createRoute('r38', { name:'নিকুঞ্জ-মতিঝিল', from:'নিকুঞ্জ', to:'মতিঝিল', cat:'dhaka_city', dist:16, time:50, stops:['নিকুঞ্জ','কুড়িল','বাড্ডা','রামপুরা','মালিবাগ','পল্টন','মতিঝিল'], traf:'medium', cnt:190 });
  createRoute('r39', { name:'মানিকগঞ্জ-ঢাকা', from:'মানিকগঞ্জ', to:'ঢাকা', cat:'intercity', dist:40, time:90, stops:['মানিকগঞ্জ','সাভার','আশুলিয়া','নবীনগর','ধানমন্ডি','ঢাকা'], traf:'medium', cnt:170, fareRange:{min:50,max:80} });
  createRoute('r40', { name:'মোহাম্মদপুর-টঙ্গী', from:'মোহাম্মদপুর', to:'টঙ্গী', cat:'intercity', dist:20, time:60, stops:['মোহাম্মদপুর','শ্যামলী','আগারগাঁও','বিজয় সরণি','মহাখালী','বিমানবন্দর','টঙ্গী'], traf:'medium', cnt:210 });
  createRoute('r41', { name:'গুলশান-সাভার', from:'গুলশান', to:'সাভার', cat:'dhaka_city', dist:20, time:60, stops:['গুলশান','বনানী','মহাখালী','বিজয় সরণি','শ্যামলী','নবীনগর','সাভার'], traf:'medium', cnt:200 });
  createRoute('r42', { name:'যাত্রাবাড়ী-মিরপুর ১২', from:'যাত্রাবাড়ী', to:'মিরপুর ১২', cat:'dhaka_city', dist:18, time:65, stops:['যাত্রাবাড়ী','কমলাপুর','শাহবাগ','বিজয় সরণি','শ্যামলী','পল্লবী','মিরপুর ১২'], traf:'high', cnt:260 });
  createRoute('r43', { name:'ঢাকা-বোর্ড বাজার', from:'ঢাকা', to:'বোর্ড বাজার', cat:'intercity', dist:25, time:65, stops:['ঢাকা','মহাখালী','বিমানবন্দর','টঙ্গী','বোর্ড বাজার'], traf:'medium', cnt:230, pop:true });
  createRoute('r44', { name:'উত্তরা-ডেমরা', from:'উত্তরা', to:'ডেমরা', cat:'dhaka_city', dist:28, time:85, stops:['উত্তরা','বিমানবন্দর','কুড়িল','বাড্ডা','রামপুরা','যাত্রাবাড়ী','ডেমরা'], traf:'high', cnt:160 });
  createRoute('r45', { name:'সাইনবোর্ড-মিরপুর ১০', from:'সাইনবোর্ড', to:'মিরপুর ১০', cat:'dhaka_city', dist:22, time:75, stops:['সাইনবোর্ড','যাত্রাবাড়ী','কমলাপুর','শাহবাগ','বিজয় সরণি','শ্যামলী','মিরপুর ১০'], traf:'high', cnt:200 });

  // ---- INTERCITY / LONG ROUTES (15 routes) ----
  createRoute('r46', { name:'ঢাকা-নারায়ণগঞ্জ', from:'ঢাকা', to:'নারায়ণগঞ্জ', cat:'intercity', dist:16, time:45, stops:['ঢাকা','যাত্রাবাড়ী','সাইনবোর্ড','চাষাড়া','নারায়ণগঞ্জ'], traf:'high', cnt:400, pop:true, fareRange:{min:20,max:50} });
  createRoute('r47', { name:'ঢাকা-চট্টগ্রাম', from:'ঢাকা', to:'চট্টগ্রাম', cat:'intercity', dist:240, time:360, stops:['ঢাকা','কুমিল্লা','ফেনী','চট্টগ্রাম'], traf:'low', cnt:600, pop:true, fareRange:{min:550,max:1200}, express:true });
  createRoute('r48', { name:'ঢাকা-সিলেট', from:'ঢাকা', to:'সিলেট', cat:'intercity', dist:310, time:420, stops:['ঢাকা','মৌলভীবাজার','সিলেট'], traf:'low', cnt:450, pop:true, fareRange:{min:650,max:1400}, express:true });
  createRoute('r49', { name:'ঢাকা-খুলনা', from:'ঢাকা', to:'খুলনা', cat:'long_route', dist:330, time:480, stops:['ঢাকা','পাবনা','খুলনা'], traf:'medium', cnt:350, fareRange:{min:700,max:1500} });
  createRoute('r50', { name:'ঢাকা-রাজশাহী', from:'ঢাকা', to:'রাজশাহী', cat:'long_route', dist:240, time:360, stops:['ঢাকা','সিরাজগঞ্জ','রাজশাহী'], traf:'low', cnt:300, fareRange:{min:500,max:1000} });
  createRoute('r51', { name:'ঢাকা-বরিশাল', from:'ঢাকা', to:'বরিশাল', cat:'long_route', dist:280, time:400, stops:['ঢাকা','মাদারীপুর','বরিশাল'], traf:'low', cnt:280, fareRange:{min:550,max:1200} });
  createRoute('r52', { name:'ঢাকা-ময়মনসিংহ', from:'ঢাকা', to:'ময়মনসিংহ', cat:'intercity', dist:120, time:180, stops:['ঢাকা','গাজীপুর','ময়মনসিংহ'], traf:'medium', cnt:250, fareRange:{min:250,max:500} });
  createRoute('r53', { name:'ঢাকা-বেনাপোল', from:'ঢাকা', to:'বেনাপোল', cat:'long_route', dist:350, time:480, stops:['ঢাকা','যশোর','বেনাপোল'], traf:'low', cnt:200, fareRange:{min:700,max:1500} });
  createRoute('r54', { name:'ঢাকা-কক্সবাজার', from:'ঢাকা', to:'কক্সবাজার', cat:'long_route', dist:400, time:600, stops:['ঢাকা','চট্টগ্রাম','কক্সবাজার'], traf:'low', cnt:250, pop:true, fareRange:{min:800,max:1800}, express:true });
  createRoute('r55', { name:'ঢাকা-রংপুর', from:'ঢাকা', to:'রংপুর', cat:'long_route', dist:350, time:480, stops:['ঢাকা','বগুড়া','রংপুর'], traf:'low', cnt:220, fareRange:{min:700,max:1500} });
  createRoute('r56', { name:'গাজীপুর-নারায়ণগঞ্জ এক্সপ্রেস', from:'গাজীপুর', to:'নারায়ণগঞ্জ', cat:'intercity', dist:40, time:90, stops:['গাজীপুর','টঙ্গী','বিমানবন্দর','বনানী','যাত্রাবাড়ী','সাইনবোর্ড','নারায়ণগঞ্জ'], traf:'medium', cnt:180, express:true });
  createRoute('r57', { name:'ঢাকা-সিরাজগঞ্জ', from:'ঢাকা', to:'সিরাজগঞ্জ', cat:'long_route', dist:150, time:240, stops:['ঢাকা','বগুড়া','সিরাজগঞ্জ'], traf:'low', cnt:150 });
  createRoute('r58', { name:'উত্তরা-চট্টগ্রাম', from:'উত্তরা', to:'চট্টগ্রাম', cat:'intercity', dist:250, time:390, stops:['উত্তরা','ঢাকা','কুমিল্লা','ফেনী','চট্টগ্রাম'], traf:'low', cnt:200 });
  createRoute('r59', { name:'নারায়ণগঞ্জ-চট্টগ্রাম', from:'নারায়ণগঞ্জ', to:'চট্টগ্রাম', cat:'intercity', dist:230, time:350, stops:['নারায়ণগঞ্জ','কুমিল্লা','ফেনী','চট্টগ্রাম'], traf:'low', cnt:170 });
  createRoute('r60', { name:'মিরপুর-ময়মনসিংহ', from:'মিরপুর ১০', to:'ময়মনসিংহ', cat:'intercity', dist:130, time:200, stops:['মিরপুর ১০','উত্তরা','গাজীপুর','ময়মনসিংহ'], traf:'medium', cnt:160 });
  createRoute('r61', { name:'সাভার-ময়মনসিংহ', from:'সাভার', to:'ময়মনসিংহ', cat:'intercity', dist:100, time:160, stops:['সাভার','গাজীপুর','ময়মনসিংহ'], traf:'medium', cnt:140 });
  createRoute('r62', { name:'ঢাকা-কুমিল্লা', from:'ঢাকা', to:'কুমিল্লা', cat:'intercity', dist:100, time:150, stops:['ঢাকা','কুমিল্লা'], traf:'low', cnt:200 });
  // ---- NARAYANGANJ DETAILED ROUTE ----
  createRoute('r63', { name:'ঢাকা-নারায়ণগঞ্জ (চাষাড়া)', from:'গুলিস্তান', to:'নারায়ণগঞ্জ', cat:'dhaka_city', dist:25, time:45, stops:['গুলিস্তান','যাত্রাবাড়ী','সাইনবোর্ড','শনির আখড়া','মদনপুর','চাষাড়া','মন্ডলপাড়া','শিবুমার্কেট','জালকুড়ি'], traf:'medium', cnt:380, pop:true, fareRange:{min:30,max:70} });

  // ---- DHAKA ROUTES FROM DATA FILE (63 routes) ----
  dhakaRoutesData.forEach((rd, idx) => {
    const fromStop = rd.stops[0].split(' (')[0];
    const toStop = rd.stops[rd.stops.length - 1].split(' (')[0];
    const stopNames = rd.stops.map(s => s.split(' (')[0]);
    const routeObj = {
      _id: id(),
      name: rd.name,
      from: fromStop,
      to: toStop,
      category: rd.category || 'dhaka_city',
      distance: rd.distance,
      estimatedTime: rd.estimatedTime,
      busStops: stopNames.map((s, i) => ({
        name: s,
        order: i + 1,
        distance: Math.round(rd.distance * (i + 1) / stopNames.length)
      })),
      buses: [],
      trafficStatus: rd.trafficLevel || 'medium',
      isActive: true,
      searchCount: 200 - idx,
      createdAt: new Date(),
      description: rd.name,
      popular: idx < 10,
      fareRange: { min: rd.fare.regular, max: rd.fare.ac }
    };
    db.routes.push(routeObj);
    r['dhaka_' + idx] = routeObj;
  });

  // ========== BUSES (70+ real buses) ==========
  const busesData = [
    // Dhaka City buses
    { n:'বিআরটিসি ডাবল ডেকার', op:0, t:'non_ac', rt:r.r1, f:10, c:70, dep:'০৬:০০', arr:'০৬:৩০', am:['ডাবল ডেকার','স্ট্যান্ডিং'] },
    { n:'বিআরটিসি সিটি সার্ভিস', op:0, t:'non_ac', rt:r.r3, f:20, c:55, dep:'০৫:৩০', arr:'০৭:০০', am:['স্ট্যান্ডিং'] },
    { n:'আজমেরী গ্লোরী ১', op:1, t:'non_ac', rt:r.r12, f:50, c:50, dep:'০৬:০০', arr:'০৭:৪৫', am:['বাতাস'] },
    { n:'আজমেরী গ্লোরী ২', op:1, t:'ac', rt:r.r12, f:80, c:40, dep:'০৭:০০', arr:'০৮:৪০', am:['এসি','বাতাস'] },
    { n:'গাজীপুর পরিবহন ১', op:2, t:'non_ac', rt:r.r15, f:45, c:50, dep:'০৬:৩০', arr:'০৭:৪০', am:[] },
    { n:'গাজীপুর পরিবহন ২', op:2, t:'non_ac', rt:r.r18, f:60, c:48, dep:'০৬:০০', arr:'০৮:০০', am:[] },
    { n:'স্কাইলাইন ১', op:3, t:'non_ac', rt:r.r11, f:40, c:50, dep:'০৬:১৫', arr:'০৭:৪৫', am:[] },
    { n:'স্কাইলাইন ২', op:3, t:'ac', rt:r.r21, f:60, c:40, dep:'০৭:০০', arr:'০৮:৩০', am:['এসি'] },
    { n:'ভিআইপি ২৭', op:4, t:'non_ac', rt:r.r4, f:30, c:50, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'তুরাগ ১', op:5, t:'non_ac', rt:r.r20, f:35, c:50, dep:'০৬:০০', arr:'০৭:১৫', am:[] },
    { n:'তুরাগ ২', op:5, t:'non_ac', rt:r.r31, f:30, c:48, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'আনাবিল ১', op:6, t:'non_ac', rt:r.r14, f:20, c:45, dep:'০৬:০০', arr:'০৬:৫০', am:[] },
    { n:'আনাবিল ২', op:6, t:'non_ac', rt:r.r13, f:25, c:45, dep:'০৭:০০', arr:'০৮:০০', am:[] },
    { n:'হিমাচল ১', op:7, t:'non_ac', rt:r.r5, f:25, c:50, dep:'০৭:০০', arr:'০৮:১৫', am:[] },
    { n:'হিমাচল ২', op:7, t:'ac', rt:r.r22, f:45, c:38, dep:'০৭:৩০', arr:'০৮:৪৫', am:['এসি'] },
    { n:'বাসুমতি ১', op:8, t:'non_ac', rt:r.r17, f:25, c:50, dep:'০৬:০০', arr:'০৭:০০', am:[] },
    { n:'ভিক্টর ক্লাসিক', op:9, t:'non_ac', rt:r.r25, f:25, c:50, dep:'০৬:০০', arr:'০৭:১৫', am:[] },
    { n:'গ্রামীণ পরিবহন', op:10, t:'non_ac', rt:r.r24, f:30, c:50, dep:'০৬:১৫', arr:'০৭:৩০', am:[] },
    { n:'বন্ধন পরিবহন', op:11, t:'non_ac', rt:r.r6, f:35, c:50, dep:'০৫:৩০', arr:'০৮:০০', am:[] },
    { n:'উৎসব পরিবহন', op:12, t:'non_ac', rt:r.r16, f:40, c:48, dep:'০৫:৩০', arr:'০৭:৩০', am:[] },
    { n:'ডলনচাপা', op:13, t:'non_ac', rt:r.r11, f:45, c:50, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'নারায়ণগঞ্জ পরিবহন ১', op:14, t:'non_ac', rt:r.r13, f:30, c:50, dep:'০৬:০০', arr:'০৭:১৫', am:[] },
    { n:'নারায়ণগঞ্জ পরিবহন ২', op:14, t:'non_ac', rt:r.r14, f:20, c:48, dep:'০৭:০০', arr:'০৭:৪৫', am:[] },
    { n:'নারায়ণগঞ্জ পরিবহন এসি', op:14, t:'ac', rt:r.r46, f:50, c:35, dep:'০৭:০০', arr:'০৮:০০', am:['এসি','বাতাস'] },
    { n:'লাল-সবুজ পরিবহন', op:-1, t:'non_ac', rt:r.r1, f:10, c:45, dep:'০৬:০০', arr:'০৬:৪৫', am:[] },
    { n:'বাংলা বাস', op:-1, t:'ac', rt:r.r1, f:20, c:30, dep:'০৭:০০', arr:'০৭:৪০', am:['এসি','মাইক্রো'] },
    { n:'উত্তরা লিংক', op:-1, t:'ac', rt:r.r4, f:50, c:35, dep:'০৬:৩০', arr:'০৮:৩০', am:['এসি','বাসা দরজা'] },
    { n:'রাজধানী এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r4, f:25, c:50, dep:'০৫:০০', arr:'০৭:০০', am:[] },
    { n:'গুলশান শাটল', op:-1, t:'ac', rt:r.r5, f:45, c:30, dep:'০৭:০০', arr:'০৮:৩০', am:['এসি','ওয়াইফাই'] },
    { n:'সাভার পরিবহন', op:-1, t:'non_ac', rt:r.r6, f:30, c:50, dep:'০৫:৩০', arr:'০৮:০০', am:[] },
    { n:'ধানমন্ডি লাইনার', op:-1, t:'non_ac', rt:r.r7, f:15, c:45, dep:'০৬:০০', arr:'০৭:০০', am:[] },
    { n:'যাত্রাবাড়ী এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r8, f:20, c:45, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'রামপুরা শাটল', op:-1, t:'non_ac', rt:r.r9, f:15, c:40, dep:'০৬:০০', arr:'০৬:৪৫', am:[] },
    { n:'শ্যামলী লিংক', op:-1, t:'non_ac', rt:r.r10, f:18, c:45, dep:'০৬:৩০', arr:'০৭:৪৫', am:[] },
    { n:'বাড্ডা এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r10, f:20, c:48, dep:'০৭:০০', arr:'০৮:০০', am:[] },
    { n:'মিরপুর লাইনার', op:-1, t:'non_ac', rt:r.r25, f:20, c:50, dep:'০৬:০০', arr:'০৭:১৫', am:[] },
    { n:'মতিঝিল শাটল', op:-1, t:'non_ac', rt:r.r21, f:25, c:48, dep:'০৬:৩০', arr:'০৭:৪৫', am:[] },
    { n:'মহাখালী লিংক', op:-1, t:'non_ac', rt:r.r15, f:40, c:50, dep:'০৭:০০', arr:'০৮:১৫', am:[] },
    { n:'কেরানীগঞ্জ লাইনার', op:-1, t:'non_ac', rt:r.r19, f:25, c:45, dep:'০৬:০০', arr:'০৭:১৫', am:[] },
    { n:'নিকুঞ্জ এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r38, f:25, c:45, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'কুড়িল শাটল', op:-1, t:'non_ac', rt:r.r34, f:20, c:45, dep:'০৬:৩০', arr:'০৭:১৫', am:[] },
    { n:'গুলশান-সাভার লিংক', op:-1, t:'non_ac', rt:r.r41, f:30, c:50, dep:'০৬:৩০', arr:'০৭:৪৫', am:[] },
    { n:'জাত্রাবাড়ী-মিরপুর সার্ভিস', op:-1, t:'non_ac', rt:r.r42, f:30, c:48, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'বোর্ড বাজার এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r43, f:35, c:50, dep:'০৬:৩০', arr:'০৭:৪৫', am:[] },
    { n:'টঙ্গী লিংক', op:-1, t:'non_ac', rt:r.r20, f:30, c:45, dep:'০৭:০০', arr:'০৮:১০', am:[] },
    { n:'বিমানবন্দর লিংক', op:-1, t:'ac', rt:r.r20, f:50, c:35, dep:'০৭:০০', arr:'০৮:১০', am:['এসি'] },
    { n:'সাইনবোর্ড এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r14, f:18, c:40, dep:'০৭:০০', arr:'০৭:৪৫', am:[] },
    { n:'মোহাম্মদপুর লাইনার', op:-1, t:'non_ac', rt:r.r5, f:25, c:48, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'উত্তরা-নারায়ণগঞ্জ এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r27, f:55, c:50, dep:'০৬:০০', arr:'০৮:০০', am:[] },
    { n:'সাভার লোকাল', op:-1, t:'non_ac', rt:r.r35, f:15, c:45, dep:'০৬:৩০', arr:'০৭:০০', am:[] },
    { n:'মানিকগঞ্জ এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r39, f:60, c:50, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'মিরপুর-বাড্ডা সার্ভিস', op:-1, t:'non_ac', rt:r.r36, f:25, c:48, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'গাজীপুর-মিরপুর লিংক', op:-1, t:'non_ac', rt:r.r30, f:40, c:50, dep:'০৬:০০', arr:'০৭:৩০', am:[] },
    { n:'ডেমরা লাইনার', op:-1, t:'non_ac', rt:r.r33, f:45, c:45, dep:'০৫:৩০', arr:'০৭:৩০', am:[] },
    { n:'সাইনবোর্ড-মিরপুর লিংক', op:-1, t:'non_ac', rt:r.r45, f:35, c:48, dep:'০৬:০০', arr:'০৭:৩০', am:[] },

    // Intercity / Long route buses
    { n:'গ্রীন লাইন এসি', op:15, t:'ac', rt:r.r47, f:950, c:40, dep:'০৭:০০', arr:'১৩:০০', am:['এসি','ওয়াইফাই','ফুড','ব্লাঙ্কেট'] },
    { n:'গ্রীন লাইন স্লিপার', op:15, t:'sleeper', rt:r.r47, f:1200, c:36, dep:'২২:০০', arr:'০৪:০০', am:['এসি','স্লিপার','ওয়াইফাই','ফুড'] },
    { n:'হানিফ এন্টারপ্রাইজ', op:16, t:'non_ac', rt:r.r47, f:550, c:50, dep:'০৬:০০', arr:'১৩:০০', am:['ওয়াটার'] },
    { n:'হানিফ এসি', op:16, t:'ac', rt:r.r48, f:1000, c:40, dep:'২১:০০', arr:'০৪:০০', am:['এসি','ওয়াইফাই'] },
    { n:'সৌদিয়া এক্সপ্রেস', op:17, t:'sleeper', rt:r.r47, f:1100, c:36, dep:'২২:০০', arr:'০৪:০০', am:['এসি','স্লিপার'] },
    { n:'সিলেট এক্সপ্রেস', op:-1, t:'ac', rt:r.r48, f:1200, c:38, dep:'২১:০০', arr:'০৪:০০', am:['এসি','স্লিপার','ওয়াইফাই'] },
    { n:'শ্যামলী পরিবহন', op:20, t:'non_ac', rt:r.r48, f:650, c:50, dep:'০৭:০০', arr:'১৪:০০', am:[] },
    { n:'শ্যামলী এসি', op:20, t:'ac', rt:r.r49, f:1100, c:40, dep:'২০:০০', arr:'০৫:০০', am:['এসি','স্লিপার'] },
    { n:'নাবিল এসি', op:18, t:'ac', rt:r.r54, f:1500, c:38, dep:'০৭:০০', arr:'১৮:০০', am:['এসি','ফুড','ওয়াইফাই'] },
    { n:'নাবিল স্লিপার', op:18, t:'sleeper', rt:r.r54, f:1800, c:34, dep:'২০:০০', arr:'০৬:০০', am:['এসি','স্লিপার','ব্লাঙ্কেট'] },
    { n:'সেন্ট মার্টিন এসি', op:19, t:'ac', rt:r.r54, f:1400, c:40, dep:'০৭:০০', arr:'১৭:০০', am:['এসি','ফুড'] },
    { n:'সেন্ট মার্টিন স্লিপার', op:19, t:'sleeper', rt:r.r54, f:1700, c:36, dep:'২১:০০', arr:'০৬:০০', am:['এসি','স্লিপার'] },
    { n:'এনা ট্রান্সপোর্ট', op:21, t:'non_ac', rt:r.r50, f:500, c:50, dep:'০৬:০০', arr:'১৪:০০', am:[] },
    { n:'এনা এসি', op:21, t:'ac', rt:r.r50, f:800, c:40, dep:'২১:০০', arr:'০৪:০০', am:['এসি','স্লিপার'] },
    { n:'কেয়া পরিবহন', op:22, t:'non_ac', rt:r.r49, f:700, c:50, dep:'০৬:০০', arr:'১৫:০০', am:[] },
    { n:'এ আর ট্রাভেলস', op:23, t:'ac', rt:r.r55, f:1200, c:40, dep:'২০:০০', arr:'০৫:০০', am:['এসি','স্লিপার'] },
    { n:'সোহাগ পরিবহন', op:24, t:'ac', rt:r.r52, f:450, c:42, dep:'০৭:০০', arr:'১০:৩০', am:['এসি'] },
    { n:'সোহাগ নন এসি', op:24, t:'non_ac', rt:r.r52, f:250, c:50, dep:'০৬:৩০', arr:'১০:০০', am:[] },
    { n:'রাজশাহী এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r50, f:550, c:50, dep:'০৬:০০', arr:'১৩:০০', am:[] },
    { n:'খুলনা লাইনার', op:-1, t:'non_ac', rt:r.r49, f:650, c:50, dep:'০৬:০০', arr:'১৪:০০', am:[] },
    { n:'বরিশাল এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r51, f:600, c:50, dep:'০৬:০০', arr:'১৪:০০', am:[] },
    { n:'বরিশাল এসি', op:-1, t:'ac', rt:r.r51, f:1000, c:40, dep:'২১:৩০', arr:'০৫:০০', am:['এসি','স্লিপার'] },
    { n:'রংপুর এক্সপ্রেস', op:-1, t:'non_ac', rt:r.r55, f:750, c:50, dep:'০৬:০০', arr:'১৫:০০', am:[] },
    { n:'ময়মনসিংহ পরিবহন', op:-1, t:'non_ac', rt:r.r52, f:300, c:50, dep:'০৭:০০', arr:'১১:০০', am:[] },
    { n:'কুমিল্লা লাইনার', op:-1, t:'non_ac', rt:r.r62, f:250, c:50, dep:'০৬:৩০', arr:'০৯:৩০', am:[] },
    { n:'বেনাপোল এসি', op:-1, t:'ac', rt:r.r53, f:1200, c:40, dep:'২০:০০', arr:'০৫:০০', am:['এসি','স্লিপার'] },
    { n:'সিরাজগঞ্জ লাইনার', op:-1, t:'non_ac', rt:r.r57, f:350, c:50, dep:'০৬:০০', arr:'১০:৩০', am:[] },

    // ---- Narayanganj Route Buses ----
    { n:'বিআরটিসি নারায়ণগঞ্জ', op:0, t:'ac', rt:r.r63, f:50, c:45, dep:'০৬:৩০', arr:'০৭:৩০', am:['এসি'] },
    { n:'হিমাচল নারায়ণগঞ্জ', op:7, t:'non_ac', rt:r.r63, f:50, c:50, dep:'০৭:১০', arr:'০৮:১০', am:[] },
    { n:'শীতল পরিবহন', op:25, t:'non_ac', rt:r.r63, f:55, c:48, dep:'০৭:৩০', arr:'০৮:৩০', am:[] },
    { n:'বাঁধন পরিবহন', op:26, t:'non_ac', rt:r.r63, f:50, c:45, dep:'০৬:০০', arr:'০৭:০০', am:[] },
    { n:'একতা পরিবহন', op:27, t:'non_ac', rt:r.r63, f:50, c:45, dep:'০৬:১৫', arr:'০৭:১৫', am:[] },
    { n:'উল্লাস পরিবহন', op:28, t:'non_ac', rt:r.r63, f:50, c:45, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'উৎসব পরিবহন', op:29, t:'non_ac', rt:r.r63, f:55, c:48, dep:'০৭:০০', arr:'০৮:০০', am:[] },
    { n:'বন্ধন পরিবহন', op:30, t:'non_ac', rt:r.r63, f:55, c:48, dep:'০৬:৪৫', arr:'০৭:৪৫', am:[] },
    { n:'স্বদেশ পরিবহন', op:31, t:'non_ac', rt:r.r63, f:55, c:45, dep:'০৬:০০', arr:'০৭:০০', am:[] },
    { n:'দোয়েল পরিবহন', op:32, t:'non_ac', rt:r.r63, f:55, c:45, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'আসিয়ান পরিবহন', op:33, t:'non_ac', rt:r.r63, f:50, c:45, dep:'০৭:০০', arr:'০৮:০০', am:[] },
    { n:'আনন্দ পরিবহন', op:34, t:'non_ac', rt:r.r63, f:50, c:45, dep:'০৬:৩০', arr:'০৭:৩০', am:[] },
    { n:'সেতু পরিবহন', op:35, t:'non_ac', rt:r.r63, f:55, c:48, dep:'০৭:১৫', arr:'০৮:১৫', am:[] },
    { n:'বোরাক পরিবহন', op:36, t:'non_ac', rt:r.r63, f:55, c:48, dep:'০৬:৪৫', arr:'০৭:৪৫', am:[] },
    { n:'প্রভাতী বনশ্রী', op:37, t:'non_ac', rt:r.r63, f:50, c:50, dep:'০৭:৩০', arr:'০৮:৩০', am:[] },
  ];

  busesData.forEach(b => {
    const operatorId = b.op >= 0 ? operators[b.op]._id : null;
    const bus = {
      _id: id(), name: b.n, operator: operatorId, type: b.t, route: b.rt._id,
      fare: b.f, seatCapacity: b.c, departureTime: b.dep, arrivalTime: b.arr,
      amenities: b.am, image: '', isActive: true, createdAt: new Date()
    };
    db.buses.push(bus);
    b.rt.buses.push(bus._id);
  });

  // ========== ANNOUNCEMENTS ==========
  db.announcements.push(
    { _id: id(), title: '🚌 গন্তব্য BD তে স্বাগতম!', message: '৬২টি রুট ও ৭০+ বাস নিয়ে বাংলাদেশের সব বাস তথ্য এখন আপনার হাতের মুঠোয়।', type: 'general', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🚦 ট্রাফিক: ফার্মগেট-গুলশান', message: 'ফার্মগেট ও গুলশান এলাকায় তীব্র যানজট। নারায়ণগঞ্জ রুটে বিকল্প পথ ব্যবহার করুন।', type: 'traffic', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🚦 ট্রাফিক: যাত্রাবাড়ী', message: 'যাত্রাবাড়ী এলাকায় সাইনবোর্ড পর্যন্ত মাঝারি যানজট। বিকাল ৪-৮টা পিক আওয়ার।', type: 'traffic', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🚦 ট্রাফিক: কুড়িল', message: 'কুড়িল ফ্লাইওভার এলাকায় যানজট। বিকল্প রুট ব্যবহার করুন।', type: 'traffic', isActive: true, createdAt: new Date() },
    { _id: id(), title: '💡 নতুন রুট', message: 'ঢাকা-নারায়ণগঞ্জ ও গাজীপুর-নারায়ণগঞ্জ ডাইরেক্ট এক্সপ্রেস রুট চালু হয়েছে।', type: 'tips', isActive: true, createdAt: new Date() },
    { _id: id(), title: '💡 পিক আওয়ার', message: 'সকাল ৮-১০টা ও বিকাল ৫-৮টা পিক আওয়ার। এই সময় ভাড়া বেশি লাগতে পারে।', type: 'tips', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🎉 নতুন বাস', message: 'টঙ্গী-সাভার ও গাজীপুর রুটে ৫টি নতুন বাস যুক্ত হয়েছে।', type: 'general', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🚦 ট্রাফিক: মিরপুর', message: 'মিরপুর ১০ ও পল্লবী এলাকায় মাঝারি যানজট।', type: 'traffic', isActive: true, createdAt: new Date() },
    { _id: id(), title: '💡 স্টুডেন্ট ডিসকাউন্ট', message: 'ছাত্র-ছাত্রীদের জন্য বিশেষ ভাড়া ছাড় চালু হয়েছে। বিআরটিসি বাসে ৫০% ছাড়।', type: 'tips', isActive: true, createdAt: new Date() },
    { _id: id(), title: '🌐 অনলাইন টিকেট', message: 'শীঘ্রই অনলাইনে বাসের টিকেট বুকিং সুবিধা চালু হচ্ছে।', type: 'general', isActive: true, createdAt: new Date() }
  );
}

function getDb() { return db; }
const Fare = { findById(id) { const d = db.fares.find(x => x._id === id); return Promise.resolve(d ? new Doc(d, 'fares') : null); } };
module.exports = { User, Route, Bus, Fare, seedDatabase, getDb };
