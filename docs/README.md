# Your startup name here

[My Notes](notes.md)

## Changelog

### 6/22/26
    -Added Elevator pitch

### 6/24/26
    -Added Key features
    -Added Technologies
    -Added Design as well as mockups

### 6/26/26
    -Added scaled versions of mockups to README.md
    -Registered the DNS gedidone.click and secured the website

### 6/29/26
    -Added HTML files: index.html, about.html, pet-meadow.html, sticky-note.html

### 7/6/26
    -Added CSS files: index.css, about.css, pet-meadow.css, sticky-note.css, main.css
    -Added styling to nav bar and home page

### 7/7/26
    -Added styling to all pages
    -Updated nav bar to be mobile friendly
    -Created meadow window

### 7/11/26
    -Ported app to React
    -An idea beyond the scope of the project was born

### 7/12/26
    -Added 'Game' page
    -Implemented Game world-tools, collision, movement

### 7/15/26
    -Added core sticky note functionality
    -Added core pet meadow functionality

### Elevator pitch

People with ADHD struggle with completing small tasks. When a task crosses their mind and they don't complete it immediately, they are unlikely to remember and complete it later. Various individuals develope niche strategies to combat this, such as placing sticky notes in visible areas. This app seeks to emulate these methods in a quick and easy to use manner. Essentially, a custom tool with a focus on low barrier of entry.

### Design

### Task Tool
![Task Tool](/Assets/Task%20screen%20mockup%20scaled.jpg)

### Pet tool
![Pet Tool](/Assets/Pet%20screen%20mockup%20scaled.jpg)

### Overview

The app will have two major components, a task tool (Mockup 1) and a pet game (Mockup 2). The first tool shouldn't require internet and should have a very short startup time as well. The goal here is to reduce friction as much as possible. The second is to help encourage use of the first by tying pet health/happiness to successful usage/follow through on the first tool.

### Key features

- Local environment where the tool functions quickly.
- Online environment where extra features such as games or cosmetics can be accessed.
- Games, Cosmetics, Leaderboards, etc.
- Functions to create motivation and competition to inspire followthrough on tasks.

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Basic structural and organizational elements.
- **CSS** - Styling and animation.
- **React** - Componentization, routing, and user reactivity using the React framework and JavaScript.
- **Service** - Endpoints provided by your backend service that support authentication and application specific functionality. The weather API [Weatherstack](https://weatherstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) will be used to emulate weather for the pet in the online element of the tool.
- **DB/Login** - Store authentication and application data.
- **WebSocket** - Realtime information pushed from your backend to your frontend.

## 🚀 Specification Deliverable

> [!NOTE]
> Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] I completed the prerequisites for this deliverable (Git commit requirement)
- [X] Proper use of Markdown
- [X] A concise and compelling elevator pitch
- [X] Description of key features
- [X] Description of how you will use each technology
- [X] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] **Rented EC2 server** - I did complete this part of the deliverable. I rented a T3 Nano server
- [X] **Leased domain name** - I did complete this part of the deliverable. The domain name I chose was gedidone.click
- [X] **Server accessible** from my domain: [https://gedidone.click](https://gedidone.click) - I did complete this part of the deliverable by renting, registering, and securing the website.

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [X] **HTML pages** - I created four pages (heavily inspired by the simon pages): A login page, sticky-note page, pet-meadow page, and about page.
- [X] **Proper HTML element usage** - I avoided div soup by implementing strategies taught in class as well as by studying the simon repo.
- [X] **Links** - I included a nav area to move around the website as well as a link to my repo.
- [X] **Text** - The about page should fulfill this requirement nicely.
- [X] **3rd party API placeholder** - The pet meadow will reference the weather API to determine environment weather.
- [X] **Images** - I indluded a favicon as well as a placeholder image of the pet.
- [X] **Login placeholder** - I slightly modified the login html from the simon repo for this.
- [X] **DB data placeholder** - The sticky-note application fulfills this requirement.
- [X] **WebSocket placeholder** - When the user loads the pet-meadow, the app will switch from "offline" to "online" (mainly only relevent for mobile usage) and websocket will backup the sticky note to the DB.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [X] **Visually appealing colors and layout. No overflowing elements.** - I went with a retro beige and pink theme to follow the whole axolotl x sticky note idea.
- [X] **Use of a CSS framework** - Tailwind
- [X] **All visual elements styled using CSS** - Everything is styled using tailwind!
- [X] **Responsive to window resizing using flexbox and/or grid display** - I implemented a mobile friendly hamburger menu to achieve this mainly.
- [X] **Use of a imported font** - Geist Pixel
- [X] **Use of different types of selectors including element, class, ID, and pseudo selectors** - This was mainly used for the pet getting bigger when hovering over it, but all are included.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [X] **Bundled using Vite** - I installed vite and am using it.
- [X] **Components** - I converted my .html files to .jsx React components.
- [X] **Router** - My website is now a single page application which now dynamically renders html... blah blah blah, I feel so pretentious writing these things.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [X] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [X] **All functionality implemented or mocked out** - Sticky note now works as an automated reminder (as long as window is kept open will improve further) and pet meadow has measurable characteristics that will eventually tie in to sticky note. Game has primary movement tech and a level creator tool (see map.jsx)
- [X] **Hooks** - Sticky note uses a hook to drag and drop and Game uses useEffect quite thoroughly to manage the gameloop (see game.jsx)

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.
- [ ] **Uses BCrypt to hash passwords** - I did not complete this part of the deliverable.

## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
