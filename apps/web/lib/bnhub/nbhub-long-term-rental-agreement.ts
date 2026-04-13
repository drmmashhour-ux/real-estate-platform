/**
 * BNHUB long-term rental agreement — landlord/tenant terms for monthly leases.
 * Counsel should review before production reliance. Fallback when no admin legal override exists.
 */
export const NBHUB_LONG_TERM_RENTAL_AGREEMENT_HTML = `
<h2>1. Parties</h2>
<ul>
<li><strong>Platform</strong>: BNHUB</li>
<li><strong>Landlord</strong> (owner)</li>
<li><strong>Tenant</strong> (renter)</li>
</ul>

<h2>2. Property details</h2>
<p>The Landlord must provide:</p>
<ul>
<li>accurate property description</li>
<li>rent amount</li>
<li>lease duration</li>
<li>conditions</li>
</ul>

<h2>3. Lease terms</h2>
<p>The rental is:</p>
<ul>
<li>long-term (monthly basis)</li>
<li>subject to agreement between landlord and tenant</li>
</ul>
<p>The Platform facilitates connection but is not the lease holder.</p>

<h2>4. Payment terms</h2>
<ul>
<li>Rent is paid between tenant and landlord (unless otherwise specified).</li>
<li>The Platform may collect service fees.</li>
</ul>

<h2>5. Commission</h2>
<p>The Landlord agrees:</p>
<ul>
<li>The Platform may charge up to <strong>one month&rsquo;s rent</strong> as commission.</li>
<li>Commission applies when the tenant is sourced via the Platform.</li>
</ul>

<h2>6. Property condition</h2>
<p>Landlord must ensure:</p>
<ul>
<li>the property is clean and habitable</li>
<li>all systems function properly</li>
</ul>

<h2>7. Tenant responsibilities</h2>
<p>Tenant must:</p>
<ul>
<li>respect the property</li>
<li>pay rent on time</li>
<li>follow lease rules</li>
</ul>

<h2>8. Platform role</h2>
<p>The Platform:</p>
<ul>
<li>connects landlord and tenant</li>
<li>may assist with communication and documentation</li>
</ul>

<h2>9. Disputes</h2>
<p>Disputes are handled between the parties, with platform support if needed.</p>

<h2>10. Acceptance</h2>
<p>By using the Platform, both parties accept these terms.</p>
`.trim();
