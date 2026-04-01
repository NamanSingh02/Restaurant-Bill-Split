# Restaurant Bill Split

A full-stack MERN web application that helps groups (friends, families) fairly split restaurant bills based on actual food consumption instead of equal division. The app supports shared dishes, custom percentage-based splits, real-time collaboration, proportional taxes/service charges/tips, and automatic room expiration.

## Problem Statement

When multiple families or friends dine together, splitting the total bill equally is simple but often unfair. Some groups may order more expensive dishes, while some items may be shared unequally.

This project solves that problem by allowing users to:

- create a shared room
- add food items with price and participating groups
- assign percentage-based consumption shares
- calculate each group’s exact bill
- proportionally distribute extra charges like taxes, service charges, and tips

---

## Features

### Room Management
- Create a room with a unique 5-digit room code
- Join an existing room using that code
- Add custom group names during room creation
- Auto-delete rooms and related food items after 5 hours using MongoDB TTL indexes

### Shared Food Spreadsheet
- Real-time shared food table for all users in the same room
- Add food items with:
  - item name
  - price
  - participating groups
  - share percentages for each group
- Default equal percentage splitting when groups are selected
- Delete food items using a trash icon in each row
- Total Bill row at the bottom of the food table

### Group Bill Calculation
- Calculate exact bill for each group based on all food entries
- Group Bills table shows the final amount owed by each group
- Total Bill row at the bottom of the group bill table

### Proportional Extra Charges
- Shared room-wide input for:
  - taxes
  - service charges
  - tips
- Users enter the final bill amount including all extra charges
- App computes a proportional ratio:

  `entered total bill / calculated food total`

- Applies that ratio to each group’s calculated bill
- Displays the ratio for transparency
- Clears the entered total automatically whenever food data changes
- Prevents invalid input where entered total is less than calculated food total

### Real-Time Collaboration
- Live updates using Socket.IO
- All users in the same room instantly see:
  - new food items
  - deleted food items
  - updated shared bill total
  - cleared bill total after food changes

### Session Handling
- Per-tab user session using `sessionStorage`
- Prevents one tab’s login from overwriting another tab’s user identity

---

## Tech Stack

### Frontend
- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- JWT Authentication
- CORS
- dotenv
- morgan

### Database
- MongoDB
- Mongoose
- TTL Indexes for automatic expiry

---

## Folder Structure

```bash
restaurant-bill-split/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── .env
│
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md