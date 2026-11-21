# NextGenYield — Comprehensive FYP Report Update Specification
## Section-by-Section Modifications Required for `main.pdf` / `main.tex`

**Document Version:** 2.0  
**Target Document:** Final Year Project Thesis Report (`main.pdf` / `main.tex` / `chapter4.tex`)  
**Scope of Expansion:**  
1. Wheat Soil Pre-Processing Tutorial & Farm Machinery Hire/Booking System  
2. Farm Team & Employee Delegation (Multi-Tenant Role-Based Access Control)  
3. Farmers Community Hub, Social Network & Direct 1-on-1 In-App Messaging  
4. Decentralized Agricultural Facebook-Style Marketplace (C2C Produce, Seeds & Equipment)

---

## 1. Executive Summary (Lines 71–100 in `main.tex`)

### Modifications Required:
- **Paragraph 2 Expansion:**  
  Update the platform summary to state that NextGenYield has expanded beyond post-sowing canopy phenotyping to encompass the **full wheat production lifecycle**, starting from **soil pre-processing** (deep chisel plowing, precision laser land leveling, and pre-sowing Rauni irrigation), accompanied by an **on-demand agricultural machinery sharing economy**.
- **Paragraph 3 Expansion:**  
  Add details on the newly incorporated **multi-tenant farm delegation system**, allowing absentee landowners and large-scale wheat farmers in Pakistan to delegate field monitoring, scouting, and canopy photo captures to farmhands/operators while retaining unified data access.
- **Paragraph 4 Expansion:**  
  Highlight the integration of a **farmer community social hub** for agricultural knowledge transfer, peer disease alerts, and direct in-app farmer messaging, alongside a **Facebook Marketplace-inspired agricultural trading platform** enabling direct farmer-to-farmer trade of certified seeds, subsidized fertilizers, harvested grain, and machinery rentals.

---

## 2. Chapter 1: Introduction

### Section 1.1: Purpose of this Document (Lines 107–112)
- **Change:** Expand system objectives to highlight that the application addresses both **agronomic intelligence** (vision AI phenotyping, soil preparation) and **socio-economic enablement** (equipment sharing, employee delegation, peer-to-peer commerce).

### Section 1.2: Intended Audience (Lines 113–115)
- **Add Target Personas:**
  - *Farmhands & Field Operators:* Responsible for day-to-day on-field inspections and canopy captures using delegated field permissions.
  - *Machinery Owners & Contractors:* Local tractor owners and laser leveling operators renting out idle equipment.
  - *Agricultural Traders & Commission Agents:* Buying and selling harvested grain lots and inputs in the marketplace.

### Section 1.3: Definitions, Acronyms and Abbreviations (Lines 116–160)
- **Add Definitions:**
  - **Rauni (رونی):** Traditional heavy pre-sowing flood irrigation applied 7–10 days before sowing to establish deep soil moisture.
  - **Laser Land Leveler:** Tractor-mounted dual-slope laser-guided grading bucket that flattens fields, saving 25–30% irrigation water.
  - **Rotavator (Rotary Tiller):** PTO-driven implement utilized in "Watter" soil conditions to pulverize clods into fine seedbed tilth.
  - **RBAC (Role-Based Access Control):** Security mechanism restricting field operations based on user role (Owner vs. Farmhand).
  - **C2C Agri-Marketplace:** Consumer-to-consumer agricultural commerce module enabling farmers to trade directly without middlemen.

---

## 3. Chapter 2: Project Vision

### Section 2.4: Goals and Objectives (Lines 175–185)
- **Add New Specific Objectives:**
  - **G7 (Pre-sowing Agronomic Guidance):** Educate farmers through interactive visual guides on hardpan breaking, laser leveling, and basal fertilizer drilling.
  - **G8 (Farm Mechanization Access):** Digitize agricultural equipment rentals, enabling farmers lacking capital equipment to book tractors, laser levelers, and seed drills on an hourly/daily basis.
  - **G9 (Decentralized Farm Delegation):** Enable multi-user farm management where landowners can assign specific parcels to hired laborers.
  - **G10 (Farmer Social Hub & Direct Commerce):** Foster farmer collaboration through regional community discussion feeds, disease warning posts, direct chat, and open marketplace listings.

### Section 2.5: Project Scope (Lines 186–214)
- **Add to Project Deliverables:**
  - Interactive Soil Pre-processing Tutorial Screen with animated laser leveling and soil tilth visualizations.
  - Machinery Rental & Time-Slot Booking Engine with conflict detection and automated rate calculations.
  - Farm Team & Delegation Management Interface with telephone-based employee onboarding.
  - Farmers Community Hub with categorized feeds, likes, comments, and real-time 1-on-1 chat.
  - Facebook-style Agri-Marketplace with multi-criteria filtering, price tagging, and one-tap seller messaging.

### Section 2.8: Stakeholders Description (Lines 242–261)
- **Add Stakeholder Profiles:**
  - *Farm Employees / Tractor Operators:* Require simplified Urdu interfaces to record observations without seeing financial or ownership settings.
  - *Machinery Providers:* Require clear booking schedules, customer phone numbers, and equipment listing management.
  - *Agri-Sellers & Buyers:* Require transparent product listings with photos, condition ratings, and direct contact options.

---

## 4. Chapter 3: Software Requirement Specifications (SRS)

### Section 3.1: List of Features (Lines 506–532)
- **Append Features 10 through 13:**
  ```latex
  \item \textbf{Soil Pre-Processing Guide \& Machinery Rental Economy:} Before initiating a 140-day crop cycle, the system guides the farmer through an interactive tutorial covering five preparatory phases: deep chisel plowing (25–30 cm), precision laser land leveling (saving 25–30\% water), pre-sowing Rauni irrigation, rotavating in ``Watter'' soil condition, and basal DAP placement. The tutorial directly connects farmers to local machinery owners offering tractors, laser levelers, rotavators, and seed drills for rent with schedule booking and cost estimation.

  \item \textbf{Multi-Tenant Farm Delegation \& Employee Field Assignment:} Landowners and farm managers can register employees (farmhands, machine operators, agronomists) using Pakistani mobile numbers and delegate access to specific field parcels. Delegated employees can log canopy scans and view agronomic advice, while all historical records, yield estimates, and audit logs remain synchronized and accessible to the owner in real time.

  \item \textbf{Farmer Social Community Hub \& In-App Direct Messaging:} An interactive community environment allowing wheat farmers to publish posts across specialized categories (Agronomy Tips, Disease Alerts, Machinery Discussions, Market Rates). Users can like, comment, establish farmer-to-farmer connections, and engage in private 1-on-1 chat conversations.

  \item \textbf{Facebook-Style Agricultural Marketplace:} A specialized decentralized marketplace allowing registered users to buy and sell agricultural items across seven categories: Seeds, Fertilizers, Machinery, Harvested Wheat Grain, Pesticides, Land Leases, and Services. Features include location-based browsing, keyword search, price range filtering, condition badges, seller verification, and one-tap ``Chat with Seller'' integration.
  ```

### Section 3.2: Functional Requirements (Lines 533–594)

#### 3.2.1: Functional Requirements for Farmers & Landowners
- **FR-15:** The system shall allow farmers to view an animated soil pre-processing guide with five stages before starting a crop cycle.
- **FR-16:** The system shall allow users to browse available agricultural machinery filtered by equipment type, district, and availability.
- **FR-17:** The system shall allow farmers to select rental time slots (start date, end date, hours) and book equipment with automated PKR fee computation.
- **FR-18:** The system shall allow machinery owners to list their equipment with daily/hourly rates, horsepower, location, and photos.
- **FR-19:** The system shall allow farm owners to add employees via Pakistani mobile numbers (`03XXXXXXXXX`) and assign specific field parcels.
- **FR-20:** The system shall allow owners to view all observations, scans, and notes logged by employees on assigned fields.
- **FR-21:** The system shall allow farmers to publish community posts with text descriptions, category tags, and optional photographs.
- **FR-22:** The system shall allow farmers to like and comment on community posts.
- **FR-23:** The system shall allow farmers to connect with and follow fellow wheat farmers within their district.
- **FR-24:** The system shall provide 1-on-1 direct in-app messaging between farmers.
- **FR-25:** The system shall allow users to post agricultural products for sale with title, price, category, condition, location, and phone number.
- **FR-26:** The system shall allow prospective buyers to search and filter marketplace listings by category, district, and price.
- **FR-27:** The system shall provide one-tap ``Chat with Seller'' and ``Call Seller'' actions on marketplace listings.
- **FR-28:** The system shall allow sellers to mark their marketplace items as sold or delete them permanently.
- **FR-35:** The system shall allow users to open and inspect the public profile of any farmer (post author, commenter, fellow network farmer, or marketplace seller), displaying verified status, total farm acreage, parcels count, community post count, contact phone, and member tenure.
- **FR-36:** The system shall provide a bidirectional friendship toggle ("Add as Friend" / "✓ Friends" / "Remove Friend") and allow users to disconnect existing relationships via `DELETE /api/v1/community/farmers/{id}/disconnect`.
- **FR-37:** The system shall allow users to tap the recipient header/avatar inside 1-on-1 chat to immediately inspect their verified farmer profile and farm statistics.
- **FR-38:** The system shall render regional and neighboring farmers' demarcated parcels on the Leaflet satellite map with distinct community styling (`.community-tag`, dashed border lines), allowing users to filter between "My Plots" and "Community Plots", inspect parcel ownership, view the owner's public profile, or initiate chat.

#### 3.2.2: Functional Requirements for Farm Employees
- **FR-29:** When an employee logs in, the system shall automatically retrieve and display all farm parcels delegated by their employer.
- **FR-30:** The system shall allow employees to perform camera-guided canopy scans and upload ViT phenotyping observations for delegated parcels.
- **FR-31:** The system shall restrict employees from modifying parcel boundary geometries or deleting fields owned by employers.

#### 3.2.3: Functional Requirements of the NextGenYield System
- **FR-32:** The system shall validate all telephone numbers to ensure compliance with Pakistani mobile telecommunications format (`03XXXXXXXXX` or `+923XXXXXXXXX`).
- **FR-33:** The system shall prevent overlapping confirmed bookings on the same machinery asset.
- **FR-34:** The system shall maintain bidirectional message synchronization in chat conversations with unread counter badges.

---

### Section 3.7: Use Cases (Lines 680–1112)

#### UC-10: Soil Pre-Processing Tutorial & Machinery Rental
- **Primary Actor:** Farmer / Landowner
- **Pre-Conditions:** User is authenticated and selects a registered fallow field.
- **Trigger:** User taps "Start Crop Cycle" or "Soil Pre-Processing Guide".
- **Main Success Scenario:**
  1. System displays prompt inquiring whether user wishes to review soil preparation before sowing.
  2. User accepts; system opens the interactive 5-stage Soil Pre-Processing Guide.
  3. User reviews animated Laser Land Leveling visualization and agronomic water-saving metrics.
  4. User taps "Hire Machinery for this Step".
  5. System presents available machinery listings matching the active step (e.g., Laser Leveler).
  6. User selects an equipment unit, specifies booking duration (e.g., 2 days), and confirms reservation.
  7. System registers booking in `machinery_bookings`, updates status to `confirmed`, and alerts the owner.
- **Post-Conditions:** Machinery booking is recorded; user proceeds to wheat sowing cycle initialization.

#### UC-11: Farm Employee Delegation & Field Assignment
- **Primary Actor:** Farm Owner
- **Pre-Conditions:** Owner has at least one demarcated field parcel.
- **Trigger:** Owner opens "Farm Team & Delegation" in Profile.
- **Main Success Scenario:**
  1. Owner taps "+ Add Employee" and inputs employee name, Pakistani phone number, and role (`farmhand`, `operator`, `agronomist`).
  2. Owner selects specific field parcels from the checklist (or selects "All Fields").
  3. System validates input, registers record in `farm_employees`, and creates associated `field_assignments`.
  4. When the employee logs in using their credentials, the system automatically surfaces the delegated parcels on the Dashboard and Map.
- **Post-Conditions:** Employee can monitor assigned parcels; owner sees all observations in real time.

#### UC-12: Farmer Community Interaction & Direct Messaging
- **Primary Actor:** Farmer
- **Trigger:** User navigates to the "Community" tab.
- **Main Success Scenario:**
  1. System displays community feed filtered by chosen category (e.g., Disease Alerts).
  2. User taps like button on a post; system updates like counter and records engagement in `post_likes`.
  3. User opens comment drawer, types agronomic advice, and submits.
  4. User navigates to "Farmers" sub-tab, locates a fellow farmer in Faisalabad, and taps "Chat".
  5. System opens direct 1-on-1 chat interface and loads message history from `chat_messages`.
  6. User sends message; system delivers and persists message with timestamp.
- **Post-Conditions:** Interaction recorded; recipient receives unread badge indicator.

#### UC-13: Agricultural Marketplace Product Listing & Purchase Inquiry
- **Primary Actor:** Farmer / Agri-Seller
- **Trigger:** User navigates to "Marketplace" tab and taps "+ Sell".
- **Main Success Scenario:**
  1. User fills in product title ("Certified Akbar-2019 Wheat Seed 50kg"), category ("Seeds"), price ("PKR 4,850"), condition ("New"), and contact phone.
  2. User submits listing; system records item in `marketplace_items` and publishes it to the marketplace grid.
  3. Prospective buyer searches for "Akbar-2019", views listing details, and taps "Chat with Seller".
  4. System automatically opens a 1-on-1 chat conversation referencing the product and price.
- **Post-Conditions:** Buyer and seller initiate direct peer-to-peer negotiation without intermediaries.

#### UC-14: Farmer Public Profile Exploration & Friend Connection
- **Primary Actor:** Registered Farmer
- **Trigger:** User taps on another farmer's avatar/name in Community feed, comments, network roster, or Marketplace listing.
- **Main Success Scenario:**
  1. System opens `UserProfileModal` displaying verified banner, display name, district, total agricultural acreage, parcels count, and community contributions count.
  2. System queries `GET /api/v1/community/users/{id}/profile` to evaluate dynamic friendship relation (`self`, `none`, `pending`, `accepted`).
  3. If user is not yet connected, system displays "Add as Friend" action.
  4. User taps "Add as Friend"; system invokes `POST /api/v1/community/farmers/{id}/connect`, transitions button to "✓ Friends", and caches state.
  5. If already connected, tapping the button prompts confirmation to remove friend and executes `DELETE /api/v1/community/farmers/{id}/disconnect`.
  6. User may also tap "Message" to directly open a 1-on-1 private chat with the farmer.
- **Post-Conditions:** Friendship relationship is updated in `user_connections`; real-time network directory reflects updated status.

---

## 5. Chapter 3 / Section 3.10: Database Design & Data Dictionaries

### 5.1 Entity-Relationship (ER) Diagram Update
The NextGenYield Entity-Relationship model is expanded from **8 entities** to **19 relational entities**:

```
[Users] (1) ───< (M) [Fields] (1) ───< (M) [CropCycles]
   │                      │
   │ (1)                  │ (1)
   ├──< (M) [MachineryListings] (1) ───< (M) [MachineryBookings] >─── (M) [Users]
   │
   ├──< (M) [FarmEmployees] (1) ───< (M) [FieldAssignments] >─── (M) [Fields]
   │
   ├──< (M) [CommunityPosts] (1) ───< (M) [PostComments]
   │          │ (1)
   │          └───< (M) [PostLikes] >─── (M) [Users]
   │
   ├──< (M) [UserConnections] >─── (M) [Users]
   │
   ├──< (M) [ChatConversations] (1) ───< (M) [ChatMessages]
   │
   └──< (M) [MarketplaceItems]
```

### 5.2 Complete LaTeX Data Dictionaries for New Entities
*Insert the following tables into `main.tex` Section 3.10.2:*

#### Table 4.9: Machinery Listing Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{MachineryListing Table Data Dictionary}
\label{tab:machinery_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
MachineryID & Primary Key & No & - & - & Unique identifier for machinery asset. \\ \hline
OwnerID & Foreign Key & No & User & Many-to-One & User offering equipment for rent. \\ \hline
Title & Varchar(100) & No & - & - & Descriptive listing title. \\ \hline
MachineryType & Varchar(40) & No & - & - & Equipment type (laser\_leveler, tractor, rotavator, seed\_drill). \\ \hline
BrandModel & Varchar(80) & Yes & - & - & Manufacturer/model (e.g., Millat MF-385). \\ \hline
Horsepower & Decimal(6,1) & Yes & - & - & Engine rated horsepower (e.g., 85.0 HP). \\ \hline
HourlyRatePKR & Decimal(10,2) & Yes & - & - & Hourly hire charge in PKR. \\ \hline
DailyRatePKR & Decimal(10,2) & No & - & - & Full-day hire charge in PKR. \\ \hline
District & Varchar(50) & No & - & - & Operational district (e.g., Faisalabad). \\ \hline
LocationAddress & Varchar(200) & Yes & - & - & Physical depot/village location. \\ \hline
ContactPhone & Varchar(20) & No & - & - & Contact phone number for operator. \\ \hline
Description & Text & Yes & - & - & Specifications and operator inclusion details. \\ \hline
ImageURL & Varchar(255) & Yes & - & - & Photo URL of the machinery unit. \\ \hline
IsAvailable & Boolean & No & - & - & Flag indicating current asset availability. \\ \hline
CreatedAt & Timestamp & No & - & - & Record creation timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.10: Machinery Booking Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{MachineryBooking Table Data Dictionary}
\label{tab:machinery_booking_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
BookingID & Primary Key & No & - & - & Unique identifier for booking reservation. \\ \hline
MachineryID & Foreign Key & No & MachineryListing & Many-to-One & Associated equipment asset. \\ \hline
RenterID & Foreign Key & No & User & Many-to-One & Farmer hiring the machinery. \\ \hline
StartDate & Timestamp & No & - & - & Scheduled hire start datetime. \\ \hline
EndDate & Timestamp & No & - & - & Scheduled hire end datetime. \\ \hline
TotalHours & Decimal(6,1) & Yes & - & - & Reserved operational hours. \\ \hline
TotalAmountPKR & Decimal(10,2) & No & - & - & Computed rental fee in PKR. \\ \hline
Status & Varchar(20) & No & - & - & Booking state (pending, confirmed, completed, cancelled). \\ \hline
PurposeStep & Varchar(50) & Yes & - & - & Agronomic step (laser\_leveling, rauni, plowing). \\ \hline
Notes & Text & Yes & - & - & Special instructions or field coordinates. \\ \hline
CreatedAt & Timestamp & No & - & - & Reservation timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.11: Farm Employee Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{FarmEmployee Table Data Dictionary}
\label{tab:farm_employee_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
EmployeeRecordID & Primary Key & No & - & - & Unique identifier for delegation record. \\ \hline
OwnerID & Foreign Key & No & User & Many-to-One & Farm owner/employer user. \\ \hline
EmployeeUserID & Foreign Key & Yes & User & Many-to-One & Linked user account (if registered). \\ \hline
EmployeeName & Varchar(60) & No & - & - & Legal name of the farmhand/operator. \\ \hline
EmployeePhone & Varchar(20) & No & - & - & Contact mobile number. \\ \hline
Role & Varchar(30) & No & - & - & Role (farmhand, operator, agronomist, manager). \\ \hline
Status & Varchar(20) & No & - & - & Delegation state (active, invited, suspended). \\ \hline
AccessAllFields & Boolean & No & - & - & Flag granting blanket access to all owner parcels. \\ \hline
CreatedAt & Timestamp & No & - & - & Onboarding timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.12: Field Assignment Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{FieldAssignment Table Data Dictionary}
\label{tab:field_assignment_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
AssignmentID & Primary Key & No & - & - & Unique identifier for parcel delegation. \\ \hline
EmployeeRecordID & Foreign Key & No & FarmEmployee & Many-to-One & Target farm employee record. \\ \hline
FieldID & Foreign Key & No & Field & Many-to-One & Delegated agricultural parcel. \\ \hline
CanScan & Boolean & No & - & - & Permission to execute camera-guided phenotyping scans. \\ \hline
CanEditSchedule & Boolean & No & - & - & Permission to toggle watering/fertilizer splits. \\ \hline
AssignedAt & Timestamp & No & - & - & Assignment delegation timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.13: Community Post Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{CommunityPost Table Data Dictionary}
\label{tab:community_post_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
PostID & Primary Key & No & - & - & Unique identifier for social post. \\ \hline
UserID & Foreign Key & No & User & Many-to-One & Author farmer. \\ \hline
AuthorName & Varchar(60) & No & - & - & Author display name. \\ \hline
AuthorDistrict & Varchar(50) & No & - & - & Origin administrative district. \\ \hline
Category & Varchar(30) & No & - & - & Category (agronomy\_tips, disease\_alert, machinery, market\_prices). \\ \hline
Title & Varchar(120) & No & - & - & Post subject heading. \\ \hline
Content & Text & No & - & - & Body text with agronomic advice/query. \\ \hline
ImageURL & Varchar(255) & Yes & - & - & Optional attached field canopy image. \\ \hline
LikesCount & Integer & No & - & - & Cached count of peer likes. \\ \hline
CommentsCount & Integer & No & - & - & Cached count of comments. \\ \hline
CreatedAt & Timestamp & No & - & - & Publication timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.14: Post Comment Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{PostComment Table Data Dictionary}
\label{tab:post_comment_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
CommentID & Primary Key & No & - & - & Unique identifier for comment. \\ \hline
PostID & Foreign Key & No & CommunityPost & Many-to-One & Target discussion post. \\ \hline
UserID & Foreign Key & No & User & Many-to-One & Commenting farmer. \\ \hline
AuthorName & Varchar(60) & No & - & - & Name of commenter. \\ \hline
Content & Text & No & - & - & Discussion feedback body text. \\ \hline
CreatedAt & Timestamp & No & - & - & Submission timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.15: Post Like Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{PostLike Table Data Dictionary}
\label{tab:post_like_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
LikeID & Primary Key & No & - & - & Unique identifier for like interaction. \\ \hline
PostID & Foreign Key & No & CommunityPost & Many-to-One & Target post. \\ \hline
UserID & Foreign Key & No & User & Many-to-One & User who liked the post. \\ \hline
CreatedAt & Timestamp & No & - & - & Like timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.16: User Connection Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{UserConnection Table Data Dictionary}
\label{tab:user_connection_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
ConnectionID & Primary Key & No & - & - & Unique identifier for farmer relationship. \\ \hline
RequesterID & Foreign Key & No & User & Many-to-One & Farmer initiating connection. \\ \hline
TargetID & Foreign Key & No & User & Many-to-One & Target farmer recipient. \\ \hline
Status & Varchar(20) & No & - & - & Connection state (pending, accepted, blocked). \\ \hline
CreatedAt & Timestamp & No & - & - & Relationship timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.17: Chat Conversation Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{ChatConversation Table Data Dictionary}
\label{tab:chat_conversation_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
ConversationID & Primary Key & No & - & - & Unique identifier for 1-on-1 thread. \\ \hline
User1ID & Foreign Key & No & User & Many-to-One & First participant. \\ \hline
User2ID & Foreign Key & No & User & Many-to-One & Second participant. \\ \hline
LastMessage & Text & Yes & - & - & Snippet of most recent message. \\ \hline
LastMessageAt & Timestamp & No & - & - & Timestamp of last message delivery. \\ \hline
CreatedAt & Timestamp & No & - & - & Thread creation timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.18: Chat Message Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{ChatMessage Table Data Dictionary}
\label{tab:chat_message_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
MessageID & Primary Key & No & - & - & Unique identifier for individual message. \\ \hline
ConversationID & Foreign Key & No & ChatConversation & Many-to-One & Associated conversation thread. \\ \hline
SenderID & Foreign Key & No & User & Many-to-One & Message author user. \\ \hline
Content & Text & No & - & - & Chat message body text. \\ \hline
IsRead & Boolean & No & - & - & Read receipt indicator. \\ \hline
CreatedAt & Timestamp & No & - & - & Delivery timestamp. \\ \hline
\end{tabular}
\end{table}
```

#### Table 4.19: Marketplace Item Data Dictionary
```latex
\begin{table}[H]
\footnotesize
\centering
\caption{MarketplaceItem Table Data Dictionary}
\label{tab:marketplace_item_table}
\begin{tabular}{|l|l|c|l|l|p{4.5cm}|}
\hline
\textbf{Attribute} & \textbf{Data Type} & \textbf{Null} & \textbf{Relation} & \textbf{Rel Type} & \textbf{Description} \\ \hline
ItemID & Primary Key & No & - & - & Unique identifier for product listing. \\ \hline
SellerID & Foreign Key & No & User & Many-to-One & Selling farmer/merchant. \\ \hline
SellerName & Varchar(60) & No & - & - & Display name of seller. \\ \hline
SellerPhone & Varchar(20) & No & - & - & Verified contact number. \\ \hline
Title & Varchar(100) & No & - & - & Product headline. \\ \hline
Category & Varchar(40) & No & - & - & Category (seeds, fertilizer, machinery, wheat\_grain, pesticides). \\ \hline
PricePKR & Decimal(12,2) & No & - & - & Listing price in PKR. \\ \hline
Condition & Varchar(20) & No & - & - & Product condition (new, used, refurbished). \\ \hline
District & Varchar(50) & No & - & - & Geographic marketplace district. \\ \hline
LocationAddress & Varchar(200) & Yes & - & - & Physical shop or mandi address. \\ \hline
Description & Text & No & - & - & Detailed specifications and bag/unit quantity. \\ \hline
ImageURL & Varchar(255) & Yes & - & - & Photo URL of the agricultural product. \\ \hline
IsSold & Boolean & No & - & - & Sold status indicator. \\ \hline
CreatedAt & Timestamp & No & - & - & Listing creation timestamp. \\ \hline
\end{tabular}
\end{table}
```

---

## 6. Chapter 4: High-Level and Low-Level Design

### Section 4.5: Domain Model / Class Diagram (Lines 1634–1642)
- **Modifications Required:**  
  Update the domain class diagram description to include:
  1. `MachineryListing` class associated with `MachineryBooking` ($1 \to *$) and `User` ($1 \to *$).
  2. `FarmEmployee` class linked with `FieldAssignment` ($1 \to *$) and `Field` ($* \to 1$).
  3. `CommunityPost` class linked with `PostComment` ($1 \to *$) and `PostLike` ($1 \to *$).
  4. `ChatConversation` class aggregating `ChatMessage` ($1 \to *$) between two `User` instances.
  5. `MarketplaceItem` class linked with seller `User`.

### Section 4.6: Sequence Diagrams (Lines 1643–1701)
*Add textual sequence descriptions for the four new core workflows:*

#### Sequence 1: Soil Pre-Processing Tutorial & Machinery Booking
1. **Farmer Mobile App** requests `GET /api/v1/machinery/?machinery_type=laser_leveler`.
2. **FastAPI Backend** queries `MachineryListing` table and filters active bookings from `MachineryBooking`.
3. **Database** returns equipment records with confirmed schedule windows.
4. **Farmer Mobile App** displays rental options and calculated cost (PKR).
5. **Farmer Mobile App** sends `POST /api/v1/machinery/{id}/book` with chosen start/end dates.
6. **FastAPI Backend** checks for date conflicts, creates `MachineryBooking` record, and returns confirmation.

#### Sequence 2: Employee Field Delegation & Canopy Observation Sync
1. **Landowner App** sends `POST /api/v1/employees/` with employee phone and assigned `field_id` array.
2. **Backend** inserts into `farm_employees` and `field_assignments`.
3. **Employee App** logs in using phone number; sends `GET /api/v1/fields/`.
4. **Backend Router** resolves delegated parcels via `field_assignments` join and returns assigned parcels.
5. **Employee App** captures canopy photo and posts `POST /api/v1/observations/`.
6. **Backend Engine** saves photo to Supabase storage, runs stage validation, and links observation to crop cycle.
7. **Landowner App** polls or re-fetches `GET /api/v1/fields/`; immediately observes the new phenological stage record.

#### Sequence 3: Community Posting & Direct Peer Messaging
1. **Farmer A App** posts `POST /api/v1/community/posts` with agronomic alert.
2. **Backend** persists post in `community_posts` and broadcasts to district feed.
3. **Farmer B App** fetches feed, views post, and taps "Chat with Author".
4. **Farmer B App** calls `POST /api/v1/community/conversations/start`.
5. **Backend** retrieves or initializes `chat_conversations` record.
6. **Farmer B App** sends message `POST /api/v1/community/conversations/{id}/messages`.
7. **Farmer A App** retrieves message on next sync interval; unread badge increments.

#### Sequence 4: Marketplace Listing & Buyer Negotiation
1. **Seller App** calls `POST /api/v1/marketplace/items` with seed batch price and photo.
2. **Backend** stores item in `marketplace_items` table.
3. **Buyer App** executes search `GET /api/v1/marketplace/items?category=seeds&district=Faisalabad`.
4. **Backend** performs indexed SQL search and returns filtered listings.
5. **Buyer App** displays product card and taps "Chat with Seller".
6. **Buyer App** initializes direct chat referencing product title and negotiated price.

#### Sequence 5: Public Farmer Profile Inspection & Friendship Toggle
1. **User App** taps on post author, commenter, or marketplace seller avatar.
2. **User App** opens `UserProfileModal` and triggers `GET /api/v1/community/users/{id}/profile`.
3. **FastAPI Backend** joins `users`, aggregates `fields` count and total acreage, counts `community_posts`, and resolves mutual record from `user_connections`.
4. **User App** renders verified badge, total acreage, parcels count, post count, and relationship button ("Add as Friend" or "✓ Friends").
5. **User App** sends `POST /api/v1/community/farmers/{id}/connect` or `DELETE /api/v1/community/farmers/{id}/disconnect`.
6. **Backend** persists connection status in `user_connections` table; UI invalidates TanStack Query cache.

---

## 7. Chapter 5: Implementation & Test Cases (Lines 1757–1822)

### Section 5.2: Test Case Design
*Add the following test case specifications:*

| Test ID | Test Name | Module | Input Data | Expected Result | Pass/Fail |
|---|---|---|---|---|---|
| **TC-15** | Machinery Listing Creation | Machinery | Title, Type, Daily Rate 18000 PKR, District | HTTP 201 Created; listing returned with ID prefix `mach_` | PASS |
| **TC-16** | Machinery Slot Reservation | Machinery | Start Date (+1 day), End Date (+3 days) | HTTP 201 Created; total amount computed as 36,000 PKR | PASS |
| **TC-17** | Conflicting Booking Prevention | Machinery | Overlapping Start/End Dates | System detects overlap; prevents double reservation | PASS |
| **TC-18** | Employee Onboarding & Delegation | Farm Team | Name: "Bashir", Phone: "03008765432", Parcel ID | HTTP 201 Created; `farm_employees` and `field_assignments` linked | PASS |
| **TC-19** | Delegated Field Access Retrieval | Farm Team | Employee Auth Token, `GET /api/v1/fields/` | HTTP 200 OK; returns employer's assigned fields | PASS |
| **TC-20** | Community Post Publication | Community | Category: `disease_alert`, Title, Content | HTTP 201 Created; post published with 0 initial likes | PASS |
| **TC-21** | Post Like Toggle | Community | `POST /api/v1/community/posts/{id}/like` | HTTP 200 OK; like toggled, `likes_count` incremented to 1 | PASS |
| **TC-22** | In-App Direct Chat Delivery | Chat | Recipient ID, Content: "Is seed available?" | HTTP 201 Created; message stored in `chat_messages` | PASS |
| **TC-23** | Marketplace Item Publication | Marketplace | Title, Category `seeds`, Price 4900 PKR | HTTP 201 Created; item active in marketplace feed | PASS |
| **TC-24** | Marketplace Category Filtering | Marketplace | Filter: `category=seeds` | HTTP 200 OK; only seed listings returned | PASS |
| **TC-25** | Marketplace Item Sold Toggle | Marketplace | `PATCH /api/v1/marketplace/items/{id}/sold` | HTTP 200 OK; `is_sold` flag updated to `true` | PASS |
| **TC-26** | Public Profile & Friend Connection | Community | `GET /community/users/{id}/profile`, Connect, Disconnect | HTTP 200 OK; aggregates acreage & fields; bidirectional connect/disconnect succeeds | PASS |

---

## 8. Summary of All Files Modified in Codebase

| File Path | Type | Changes Implemented |
|---|---|---|
| `backend/app/models/machinery.py` | SQLAlchemy Model | Created `MachineryListing` and `MachineryBooking` tables |
| `backend/app/models/employee.py` | SQLAlchemy Model | Created `FarmEmployee` and `FieldAssignment` tables |
| `backend/app/models/community.py` | SQLAlchemy Model | Created `CommunityPost`, `PostComment`, `PostLike`, `UserConnection`, `ChatConversation`, `ChatMessage` tables |
| `backend/app/models/marketplace.py` | SQLAlchemy Model | Created `MarketplaceItem` table |
| `backend/app/models/__init__.py` | Model Registry | Exported all 11 new models for automatic schema creation |
| `backend/app/schemas/machinery.py` | Pydantic v2 | Created DTO validation models for machinery rentals and bookings |
| `backend/app/schemas/employee.py` | Pydantic v2 | Created DTO validation models for employee management and field assignments |
| `backend/app/schemas/community.py` | Pydantic v2 | Created DTO validation models for posts, likes, comments, direct chat, and `PublicUserProfileResponse` |
| `backend/app/schemas/marketplace.py` | Pydantic v2 | Created DTO validation models for marketplace listings |
| `backend/app/schemas/field.py` | Pydantic v2 | Hydrated `FieldResponse` with active cycle fields (`crop_cycle_id`, `sowing_date`, `phenological_stage`, `current_das`, `has_active_cycle`) |
| `backend/app/schemas/advisory.py` | Pydantic v2 | Standardized `AdvisoryRuleResponse` aliases and field compatibility |
| `backend/app/routers/machinery.py` | REST Router | Endpoints for listing, filtering, booking, and managing machinery |
| `backend/app/routers/employees.py` | REST Router | Endpoints for adding employees, delegating fields, and employee field queries |
| `backend/app/routers/community.py` | REST Router | Endpoints for social feed, likes, comments, connections, chat, public farmer profile (`/users/{id}/profile`), and disconnect (`/farmers/{id}/disconnect`) |
| `backend/app/routers/marketplace.py` | REST Router | Endpoints for agricultural marketplace items, filters, sold toggling |
| `backend/app/routers/fields.py` | REST Router | Updated `get_user_fields` & `get_field_by_id` to include assigned employee fields and active cycle data |
| `backend/app/main.py` | FastAPI Application | Registered all 4 new routers into API v1 |
| `backend/app/core/seed_data.py` | Database Seeder | Idempotent seeding of machinery, community posts, and marketplace items |
| `backend/tests/test_backend_flow.py` | Integration Tests | Added 5 end-to-end integration tests (TC-15 through TC-26) |
| `frontend/services/api-client.ts` | TypeScript API | Added DTO interfaces (`PublicUserProfileDTO`, etc.) and client methods |
| `frontend/hooks/use-machinery.ts` | TanStack Query | Query and mutation hooks for machinery rentals and bookings |
| `frontend/hooks/use-employees.ts` | TanStack Query | Query and mutation hooks for farm employees and field assignments |
| `frontend/hooks/use-community.ts` | TanStack Query | Query and mutation hooks for community feed, comments, likes, chat, user profile, and friend disconnect |
| `frontend/hooks/use-marketplace.ts` | TanStack Query | Query and mutation hooks for marketplace items and listings |
| `frontend/constants/translations.ts` | Bilingual Dictionary | Added English and Urdu translation tokens for all 4 feature sets |
| `frontend/components/soil-prep-guide.tsx` | UI Component | 5-stage interactive animated guide with machinery rental modal |
| `frontend/components/farm-team-manager.tsx` | UI Component | Employee management modal with Pakistani phone validation and field assignment |
| `frontend/components/user-profile-modal.tsx` | UI Component | Farmer public profile modal with verified badge, farm stats, call, chat, and "Add as Friend" / "Remove Friend" |
| `frontend/app/(tabs)/community.tsx` | UI Screen | Farmers Community tab with Feed, Network, Direct Chat, and Profile trigger |
| `frontend/app/(tabs)/marketplace.tsx` | UI Screen | Facebook-style Agricultural Marketplace with search, categories, seller chat, and Seller Profile modal |
| `frontend/app/(tabs)/_layout.tsx` | Navigation Tabs | Configured bottom tab bar with 6 responsive tabs |
| `frontend/app/(tabs)/index.tsx` | Home Dashboard | Added soil prep prompt on fallow field and quick platform service shortcuts |
| `frontend/app/(tabs)/profile.tsx` | User Profile | Added Farm Management & Agri Services hub |
| `frontend/REPORT TEMPLATE/schema.sql` | SQL Schema | Updated PostgreSQL DDL schema with all 11 new tables and indexes |
