# <p align="center"><img src="assets/logo.png" alt="EcoTrack AI Logo" width="200"></p>

# 🌿 EcoTrack AI — Carbon Footprint Intelligence Platform


[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/release/python-380/)
[![Flask](https://img.shields.io/badge/flask-%23000.svg?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/en/2.3.x/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JS](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)](https://www.javascript.com/)

> **Track Your Carbon Impact, Save The Planet.**
> Advanced AI platform that calculates, predicts, and helps reduce your carbon emissions with smart recommendations and real-time insights.

---

## 🌟 Overview

**EcoTrack AI** is a comprehensive Carbon Footprint Intelligence Platform designed to empower individuals and organizations to understand and minimize their environmental impact. By leveraging **Machine Learning** and **India-specific emission factors**, the platform provides a precise, actionable, and engaging experience for sustainability tracking.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **⚡ Smart Calculator** | Measure emissions from transport, electricity, food & shopping with specialized factors. |
| **🤖 AI Predictions** | ML models predict future carbon footprint trends based on logging history. |
| **🏆 EcoScore System** | A dynamic 0–800 rating system with personalized "Green Tips" for improvement. |
| **📊 Analytics Dashboard** | Interactive charts, trend analysis, and year-on-year comparisons. |
| **🌲 Offset Calculator** | Real-time calculations of trees needed for carbon neutrality and solar savings. |
| **🎯 Campus Leaderboard** | Community-driven competition with NGO and CSR integration. |
| **📱 WhatsApp Sync** | Integrated notification system via Twilio for weekly summaries and alerts. |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Modern, responsive UI with Glassmorphism and CSS variables.
- **Vanilla JavaScript**: Dynamic interactions and real-time data visualization.
- **Canvas API**: Interactive particle background effects.

### Backend
- **Python (Flask)**: Robust API handled via Flask-CORS for cross-origin requests.
- **MongoDB**: Scalable NoSQL database for user profiles, activity logs, and scores.
- **JWT & Bcrypt**: Secure authentication and password hashing.

### AI & Data Science
- **Google Generative AI**: Gemini API for intelligent, personalized recommendations.
- **Scikit-learn**: Predictive modeling for future carbon footprint trends.
- **Pandas/NumPy**: Data processing and statistical analysis.

---

## ⚙️ Installation & Setup

### Prerequisites
- [Python 3.8+](https://www.python.org/downloads/)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) (or local MongoDB)
- [Google AI (Gemini) API Key](https://aistudio.google.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Bhavishaya789/EcoTrack_AI.git
cd EcoTrack_AI
```

### Step 2: Configure Environment Variables
Create a `.env` file inside the `backend_py/` directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

### Step 3: Run the Application (Windows)
Simply run the included batch file:
```bash
Launch_EcoTrack_AI.bat
```
*This will automatically install dependencies, start the backend (Port 5050), start the frontend (Port 8080), and open the app in your browser.*

---

## 📖 How to Use

1. **Sign Up**: Create an account and set your baseline (location, lifestyle type).
2. **Log Activity**: Enter your daily/weekly data for transport, energy, and consumption.
3. **Analyze**: View your **EcoScore** and deep-dive into the AI-generated analytics.
4. **Improve**: Follow the "Smart Recommendations" to lower your footprint and boost your score.
5. **Compete**: Check the leaderboard to see how you rank among other Eco-Warriors.

---

## 🖼️ Screenshots

<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=EcoTrack+AI+Hero+Section" alt="Hero Section" width="800">
  <br>
  <i>Main Landing Page with Animated Backgrounds</i>
</p>

<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=EcoTrack+AI+Dashboard" alt="Dashboard" width="800">
  <br>
  <i>Interactive Analytics and EcoScore Dashboard</i>
</p>

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Project Lead:** Bhavishaya  
**GitHub:** [Bhavishaya789](https://github.com/Bhavishaya789)  
**Project Link:** [https://github.com/Bhavishaya789/EcoTrack_AI](https://github.com/Bhavishaya789/EcoTrack_AI)

---

<p align="center">
  <b>Built with ❤️ for a Greener Tomorrow</b>
</p>
