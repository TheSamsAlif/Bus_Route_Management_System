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

  // ========== ROUTES (from dhakaRoutes.js) ==========

  // ---- DHAKA ROUTES FROM DATA FILE (53 routes) ----
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

    // Auto-generate buses from route data
    rd.buses.forEach(busName => {
      const bus = {
        _id: id(),
        name: busName,
        operator: null,
        type: 'non_ac',
        route: routeObj._id,
        fare: rd.fare.regular,
        seatCapacity: 50,
        departureTime: '০৬:০০',
        arrivalTime: '০৮:০০',
        amenities: [],
        image: '',
        isActive: true,
        createdAt: new Date()
      };
      db.buses.push(bus);
      routeObj.buses.push(bus._id);
    });
  });

  // ========== ANNOUNCEMENTS ==========
  db.announcements.push(
    { _id: id(), title: '🚌 গন্তব্য BD তে স্বাগতম!', message: '৫৩টি রুট ও ৫৩+ বাস নিয়ে বাংলাদেশের সব বাস তথ্য এখন আপনার হাতের মুঠোয়।', type: 'general', isActive: true, createdAt: new Date() },
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
