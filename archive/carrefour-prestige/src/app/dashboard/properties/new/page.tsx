import { createPropertyAction } from "@/actions/property";

export default function NewPropertyPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-light text-white">New listing</h1>
      <form action={createPropertyAction} className="mt-6 flex flex-col gap-3 text-sm">
        <input name="title" placeholder="Title" required className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <textarea
          name="description"
          placeholder="Description"
          required
          className="min-h-[100px] rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white"
        />
        <input name="price" type="number" placeholder="Price CAD" required className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <input name="city" placeholder="City" required className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <input name="address" placeholder="Address" required className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <select name="propertyType" required className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white">
          <option value="CONDO">Condo</option>
          <option value="HOUSE">House</option>
          <option value="TOWNHOUSE">Townhouse</option>
          <option value="MULTI_FAMILY">Multi-family</option>
          <option value="LAND">Land</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="OTHER">Other</option>
        </select>
        <input name="bedrooms" type="number" defaultValue={2} className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <input name="bathrooms" type="number" step="0.5" defaultValue={2} className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <input name="areaSqm" type="number" placeholder="Area m² (optional)" className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white" />
        <select name="status" className="rounded-lg border border-emerald-900/60 bg-[#0c1a14] px-3 py-2 text-white">
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
        </select>
        <button
          type="submit"
          className="mt-2 rounded-full bg-[#d4af37] px-6 py-2 font-semibold text-[#030712]"
        >
          Save
        </button>
      </form>
    </div>
  );
}
