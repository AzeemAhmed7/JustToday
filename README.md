## Fixing an invalid Gemini API key

`API key not valid` is a Google credential/configuration error; changing frontend code cannot make an invalid key valid. In Vercel → Project → Settings → Environment Variables, replace the value of the exact key `GEMINI_API_KEY` with a newly created Google AI Studio API key from https://aistudio.google.com/apikey. Do not include quote marks, spaces, or a `VITE_` prefix. Ensure the key is not deleted/restricted from Generative Language API access, save, then redeploy the Production deployment. The API now returns a direct explanation for this error.

## Visual identity

The header currently displays the repository owner's GitHub profile image. If the Vercel project uses a different profile image, provide its public image URL or add the desired image as `public/profile.png`; Vercel does not automatically expose its dashboard profile image to deployed app code.
