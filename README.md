✈️ Aircraft Engine Remaining Useful Life (RUL) Prediction

A full-stack machine learning application that predicts the Remaining Useful Life (RUL) of aircraft engines using the NASA CMAPSS FD004 dataset.

The system includes:

Data preprocessing
Exploratory Data Analysis (EDA)
Multiple regression models
PostgreSQL database
Interactive React dashboard

🚀 Features
📂 Data Upload
Drag-and-drop upload of CMAPSS FD004 files:
train_FD004.txt
test_FD004.txt
RUL_FD004.txt
📊 EDA Dashboard
Descriptive statistics table
Visualizations:
Pie chart (operational settings)
Line chart (degradation trends)
Boxplot summary
Correlation analysis:
Top features correlated with RUL
🤖 Model Training
Supported models:
Linear Regression
Random Forest
Polynomial Regression (degree 2)
Automatic feature engineering (rolling window statistics)
Evaluation metrics:
RMSE
MAE
R²
CMAPSS asymmetric score
Model comparison bar chart


🔮 Prediction
Upload CSV for a single engine
Predict RUL using trained models
View prediction history
🎨 UI Features
Dark / Light theme toggle
🧱 Technology Stack
Layer	Technology
Backend	FastAPI, SQLAlchemy, Pandas, Scikit-learn
Database	PostgreSQL
Frontend	React, Vite, Material-UI, Recharts, Axios
Deployment	Local environment

⚙️ Setup Instructions
📌 Prerequisites
Python 3.9+
Node.js 18+
PostgreSQL installed locally

⚙️ Setup Instructions
📌 Prerequisites
Python 3.9+
Node.js 18+
PostgreSQL installed locally
🖥️ Backend Setup
1. Clone the Repository
git clone <repository-url>
cd rul_prediction_system/backend
2. Create Virtual Environment
python -m venv venv

Activate environment:
Windows

venv\Scripts\activate

macOS/Linux

source venv/bin/activate
3. Install Dependencies
pip install -r requirements.txt
4. Configure Environment
cp .env.example .env

Update .env:

DATABASE_URL=postgresql://username:password@localhost:5432/rul_prediction
5. Create Database (PostgreSQL)

Run in PostgreSQL:

CREATE DATABASE rul_prediction;
6. Initialize Database
python init_db.py
7. Run Backend Server
uvicorn app.main:app --reload --port 8000
🌐 Frontend Setup
1. Navigate to Frontend
cd ../frontend
2. Install Dependencies
npm install
3. Run Development Server
npm run dev
4. Access Application

Open in browser:

http://localhost:5000

📘 Usage Guide
1. Upload Dataset
Go to Data Upload tab
Upload:
train_FD004.txt
test_FD004.txt
RUL_FD004.txt
Click Upload and Validate
2. Explore Data (EDA)
Open EDA Dashboard
View statistics, charts, and correlations
3. Train Models
Go to Model Training
Select a model
Click Train Model
Compare results using charts
4. Predict RUL
Open Prediction tab
Select model
Upload engine CSV
Click Predict RUL
5. View History
Check History tab for previous predictions
🔌 API Endpoints
Method	Endpoint	Description
POST	/api/upload	Upload dataset
GET	/api/datasets	List datasets
GET	/api/eda/statistics	Statistics
GET	/api/eda/visualizations	Charts data
GET	/api/eda/correlation/heatmap	Correlation matrix
POST	/api/train	Train model
GET	/api/models	List models
GET	/api/models/compare	Compare models
POST	/api/predict	Predict RUL
GET	/api/predictions	Prediction history
🛠️ Troubleshooting

422 Error on /models/compare

Ensure route order in training.py
Place /models/compare before /models/{model_id}
Restart backend

NaN Errors During Training

Caused by rolling window features
Automatically handled by dropping NaN rows

CORS Errors

Check CORS_ORIGINS in config.py
Ensure it matches frontend URL
📜 License

This project is for educational purposes as part of a Cavendish University Uganda capstone project.
NASA CMAPSS dataset is publicly available.


🙏 Acknowledgements
NASA Prognostics Center of Excellence
Scikit-learn
FastAPI
React


👨‍💻 Authors
Edrin Kibendo
Paul Ssozi





