// build-email.js

const fs = require('fs'); // For file system operations
const path = require('path'); // For handling file paths
const Handlebars = require('handlebars'); // The Handlebars templating engine
const mjml2html = require('mjml'); // The MJML compiler

console.log("Starting email build process...");

// --- Define Handlebars Helpers ---
// Helper to format price (e.g., EUR 9.00)
Handlebars.registerHelper('formatPrice', function(value, unit) {
  if (value === null || value === undefined || !unit) return '';
  // Ensure value is treated as a number for formatting
  const numberValue = Number(value); 
  if (isNaN(numberValue)) return ''; // Handle cases where value isn't a number
  return `${unit} ${numberValue.toFixed(2)}`;
});

// Helper to find a specific characteristic (like 'color', 'storage')
Handlebars.registerHelper('findCharacteristic', function(characteristics, name) {
  if (!Array.isArray(characteristics)) return '';
  const characteristic = characteristics.find(c => c.name === name);
  return characteristic ? characteristic.value : '';
});

// Helper to find the customer object in relatedParty array
Handlebars.registerHelper('findCustomer', function(parties) {
    if (!Array.isArray(parties)) return null;
    return parties.find(p => p.role === 'customer');
});

// Helper to format the shipping address
Handlebars.registerHelper('formatAddress', function(address) {
    if (!address) return '';
    // Build address string step-by-step to handle missing parts gracefully
    let parts = [];
    if (address.streetName) parts.push(address.streetName);
    if (address.streetNumber) parts.push(address.streetNumber);
    let streetPart = parts.join(' ');
    if (address.apartmentNumber) streetPart += `, Apt ${address.apartmentNumber}`;
    
    parts = [streetPart]; // Reset parts array with street info
    if (address.postalCode) parts.push(address.postalCode);
    if (address.city) parts.push(address.city);
    let cityPart = parts.slice(1).join(' '); // Join postal code and city

    parts = [streetPart, cityPart]; // Combine street and city parts
    if(address.country) parts.push(address.country);

    return parts.filter(Boolean).join(', '); // Join all parts with comma, removing empty ones
});


// Helper to find the provider object
Handlebars.registerHelper('findProvider', function(parties) {
    if (!Array.isArray(parties)) return null;
    return parties.find(p => p.role === 'provider');
});

// Helper to calculate the original total price before discounts
Handlebars.registerHelper('calculateOriginalTotal', function(orderTotal) {
    if (!orderTotal?.price?.taxIncludedAmount) return null; // Need base price info

    const finalPrice = orderTotal.price.taxIncludedAmount.value || 0;
    // Sum up all discount alterations affecting the total price
    const totalDiscount = orderTotal.priceAlteration?.reduce((sum, alt) => {
        if (alt.priceType === 'DISCOUNT' && alt.price?.taxIncludedAmount?.value !== null) {
            return sum + alt.price.taxIncludedAmount.value;
        }
        return sum;
    }, 0) || 0;

    const originalValue = finalPrice + totalDiscount;

    return { 
      value: originalValue, 
      unit: orderTotal.price.taxIncludedAmount.unit 
    };
});


// Helper to determine if a sub-product should be displayed (filters out null prices)
Handlebars.registerHelper('isDisplayable', function(item) {
    // Check specifically for the price object and its taxIncludedAmount value
    return item?.price?.taxIncludedAmount?.value !== null && item?.price?.taxIncludedAmount?.value !== undefined;
});
// --- End of Helpers ---


// --- Main Build Logic ---
try {
  // 1. Define file paths
  const mjmlTemplatePath = path.join(__dirname, 'index.mjml');
  const orderDataPath = path.join(__dirname, 'orderBasket.json');
  const outputHtmlPath = path.join(__dirname, 'output.html'); // Where the final HTML will be saved

  console.log(`Reading MJML template from: ${mjmlTemplatePath}`);
  console.log(`Reading JSON data from: ${orderDataPath}`);

  // 2. Read files
  const mjmlTemplate = fs.readFileSync(mjmlTemplatePath, 'utf8');
  const orderDataString = fs.readFileSync(orderDataPath, 'utf8');
  
  // 3. Parse JSON data
  const orderData = JSON.parse(orderDataString);

  // 4. Compile Handlebars template
  console.log("Compiling Handlebars template...");
  const compiledHbsTemplate = Handlebars.compile(mjmlTemplate);

  // 5. Execute template with data -> This results in MJML with data injected
  console.log("Injecting data into template...");
  const mjmlWithData = compiledHbsTemplate(orderData);

  // 6. Compile MJML to HTML
  console.log("Compiling MJML to HTML...");
  const { html, errors } = mjml2html(mjmlWithData, {
      // MJML compilation options (optional)
      // validationLevel: 'strict', // Use 'strict' for thorough validation, 'soft' or 'skip' otherwise
      // filePath: mjmlTemplatePath // Helps resolve relative paths if you use mj-include
  });

  // 7. Check for MJML errors
  if (errors.length > 0) {
      console.error("MJML Compilation Errors encountered:");
      errors.forEach(error => console.error(`- Line ${error.line}: ${error.message} (${error.tagName})`));
      // Decide if you want to stop or proceed despite errors
      // process.exit(1); // Optional: Exit script if errors occur
  } else {
      console.log("MJML compilation successful.");
  }

  // 8. Write the final HTML to output file
  fs.writeFileSync(outputHtmlPath, html, 'utf8');
  console.log(`Successfully generated HTML email! Output saved to: ${outputHtmlPath}`);

} catch (error) {
  console.error("\n--- An error occurred during the build process ---");
  console.error(error);
  process.exit(1); // Exit with an error code
}
// --- End of Main Build Logic ---