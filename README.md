**Summary**
To design a dynamic order confirmation email template, I used MJML for adaptive email design and Handlebars to add dynamic data from a JSON order basket. I created custom Handlebars helpers to retrieve customer details, product details (including sub-products), and calculate the total price. The problem I faced was the proper rendering of nested sub-products and the removal of hidden or technical SKUs. I solved this by using conditional statement logic and recursive rendering in the template.

I used AI tools (ChatGPT and Gemini) to learn about how MJML and Handlebars work, get debugging assistance, and document or structure the code in the process.

Tools used: MJML, Handlebars, Node.js, AI tools
Challenges: Learning a new framework, nested product rendering, filtering technical SKUs, layout cleanliness with padding and styling.
