/**
 * BNHUB short-term rental agreement — host/guest marketplace terms.
 * Counsel should review before production reliance. Shown on `/bnhub/host-agreement` and stored on acceptance when no admin legal override exists.
 */
export const NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML = `
<h2>1. Parties</h2>
<p>This agreement is entered into between:</p>
<ul>
<li><strong>Platform</strong>: BNHUB (the &ldquo;Platform&rdquo;)</li>
<li><strong>Host</strong>: The property owner or authorized representative (the &ldquo;Host&rdquo;)</li>
<li><strong>Guest</strong>: The individual booking the property (the &ldquo;Guest&rdquo;)</li>
</ul>

<h2>2. Property details</h2>
<p>The Host agrees to provide accurate and complete information, including:</p>
<ul>
<li>Property address and exact location</li>
<li>Type of property (room, apartment, house, etc.)</li>
<li>Number of guests allowed</li>
<li>Amenities included (WiFi, kitchen, parking, etc.)</li>
<li>Optional services (e.g., shuttle, airport pickup)</li>
</ul>
<p>The property must match the listing description at all times.</p>

<h2>3. Cleanliness &amp; quality standards</h2>
<p>The Host agrees that the property must:</p>
<ul>
<li>Be <strong>cleaned and sanitized before each stay</strong></li>
<li>Be free from:
  <ul>
    <li>pests (including bugs, mosquitoes, infestations)</li>
    <li>strong odors</li>
    <li>unsafe or damaged equipment</li>
  </ul>
</li>
<li>Include clean:
  <ul>
    <li>bedding</li>
    <li>towels (if provided)</li>
    <li>kitchen surfaces and bathroom</li>
  </ul>
</li>
</ul>
<p>Cleaning must follow a <strong>standardized checklist</strong> provided by the Platform.</p>
<p>Failure to meet these standards may result in:</p>
<ul>
<li>refunds to the Guest</li>
<li>penalties or suspension of the Host</li>
</ul>

<h2>4. Safety requirements</h2>
<p>The Host must ensure:</p>
<ul>
<li>Safe access to the property</li>
<li>Functional locks and security measures</li>
<li>No hazardous conditions</li>
<li>Compliance with local safety regulations</li>
</ul>

<h2>5. Booking &amp; payment flow</h2>
<h3>Payment process</h3>
<ol>
<li>Guest pays the full booking amount to the Platform</li>
<li>Platform holds the funds securely</li>
<li>After check-in and successful stay:
  <ul>
    <li>Platform releases payment to Host <strong>after 7 days</strong></li>
  </ul>
</li>
</ol>
<h3>Platform fees</h3>
<ul>
<li>Platform retains a service fee (e.g., under 2% of the booking subtotal, as disclosed at checkout)</li>
</ul>

<h2>6. Cancellation &amp; refund policy</h2>
<h3>Guest refunds</h3>
<p>Guest may be eligible for refund if:</p>
<ul>
<li>Property does not match listing</li>
<li>Cleanliness standards are not met</li>
<li>Safety issues are present</li>
</ul>
<p>Refund types:</p>
<ul>
<li>Full refund (major issue)</li>
<li>Partial refund (minor issue)</li>
</ul>
<h3>Host cancellation</h3>
<p>If Host cancels:</p>
<ul>
<li>Full refund to Guest</li>
<li>Possible penalty to Host</li>
</ul>

<h2>7. Guest responsibilities</h2>
<p>Guest agrees to:</p>
<ul>
<li>Respect the property</li>
<li>Follow house rules</li>
<li>Not exceed occupancy limits</li>
<li>Avoid damage or illegal activity</li>
</ul>
<p>Guest may be charged for damages.</p>

<h2>8. Host responsibilities</h2>
<p>Host agrees to:</p>
<ul>
<li>Provide accurate listing</li>
<li>Maintain property quality</li>
<li>Be available for communication</li>
<li>Respect booking commitments</li>
</ul>

<h2>9. Optional services</h2>
<p>If offered, Host must clearly specify:</p>
<ul>
<li>Shuttle service availability</li>
<li>Airport pickup/drop-off</li>
<li>Additional fees (if any)</li>
</ul>
<p>All services must be delivered as described.</p>

<h2>10. Location accuracy</h2>
<ul>
<li>Property location must be accurate on the map</li>
<li>Misleading location information is strictly prohibited</li>
</ul>

<h2>11. Dispute resolution</h2>
<p>The Platform may:</p>
<ul>
<li>Review complaints</li>
<li>Request evidence</li>
<li>Issue refunds</li>
<li>Apply penalties</li>
</ul>
<p>Platform decisions are binding for dispute resolution within the system.</p>

<h2>12. Liability limitation</h2>
<p>The Platform acts as an intermediary and is not responsible for:</p>
<ul>
<li>personal disputes beyond reasonable control</li>
<li>damages not reported properly</li>
</ul>

<h2>13. Acceptance</h2>
<p>By listing or booking, both Host and Guest agree to:</p>
<ul>
<li>all terms of this agreement</li>
<li>platform policies</li>
<li>applicable local laws</li>
</ul>
`.trim();
