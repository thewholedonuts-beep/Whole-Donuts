const authConfig = window.UNIVERSE_AUTH_CONFIG || {};
const signInPanel = document.querySelector("#award-signin");
const signInForm = document.querySelector("#award-signin-form");
const emailInput = document.querySelector("#award-email");
const signInStatus = document.querySelector("#award-signin-status");
const signInCopy = document.querySelector("#award-signin-copy");
const memberGreeting = document.querySelector("#member-greeting");
const greetingTitle = document.querySelector("#member-greeting-title");
const greetingCopy = document.querySelector("#member-greeting-copy");
const awardCode = new URLSearchParams(location.search).get("award");
const crumbForm = document.querySelector("#crumb-form");
const crumbCategory = document.querySelector("#crumb-category");
const crumbSource = document.querySelector("#crumb-source");
const crumbContent = document.querySelector("#crumb-content");
const crumbRights = document.querySelector("#crumb-rights");
const crumbStatus = document.querySelector("#crumb-status");
let journeySync;

function isConfigured() {
  return authConfig.supabaseUrl && authConfig.supabaseAnonKey;
}

function setStatus(message) {
  signInStatus.textContent = message;
}

function setCrumbStatus(message) {
  crumbStatus.textContent = message;
}

function destinationUrl() {
  const url = new URL(location.href);
  if (awardCode) {
    url.searchParams.set("award", awardCode);
  }
  return url.toString();
}

async function loadAuth() {
  if (!isConfigured()) {
    crumbForm.addEventListener("submit", event => {
      event.preventDefault();
      setCrumbStatus("The crumb workshop opens after the member sign-in system is configured.");
    });
    return;
  }

  signInPanel.hidden = false;
  if (awardCode) {
    signInCopy.textContent = "Your Dedication Award is ready. Use the email it was issued to so we can restore your place.";
  }

  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const supabase = createClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey);
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    setStatus("We could not check your sign-in. Please try again.");
    return;
  }

  let currentUser = session ? session.user : null;
  if (currentUser) {
    await welcomeMember(supabase, session.user);
  }

  signInForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      return;
    }

    setStatus("Sending your secure sign-in link...");
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: destinationUrl() }
    });
    setStatus(signInError
      ? "We could not send the link. Please check the address and try again."
      : "Check your email for a private sign-in link.");
  });

  crumbForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) {
      setCrumbStatus("Sign in with your email link first, then return here to send your crumb.");
      signInPanel.hidden = false;
      emailInput.focus();
      return;
    }

    setCrumbStatus("Sending your crumb for review...");
    const { error: crumbError } = await supabase.from("crumb_submissions").insert({
      submitted_by: currentUser.id,
      category: crumbCategory.value,
      source_url: crumbSource.value.trim() || null,
      content: crumbContent.value.trim(),
      rights_confirmed: crumbRights.checked
    });
    if (crumbError) {
      console.error("Could not submit crumb.", crumbError);
      setCrumbStatus("We could not send that crumb. Please try again.");
      return;
    }
    crumbForm.reset();
    setCrumbStatus("Thank you. Your crumb is in the review queue.");
  });
}

async function welcomeMember(supabase, user) {
  let greeting = "";
  if (awardCode) {
    const { data, error } = await supabase.rpc("claim_dedication_award", { award_code: awardCode });
    if (!error && data) {
      greeting = data;
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile && profile.display_name ? `, ${profile.display_name}` : "";

  greetingTitle.textContent = `Welcome${name}.`;
  greetingCopy.textContent = greeting || "Your place at the table is here when you are ready.";
  memberGreeting.hidden = false;
  signInPanel.hidden = true;

  journeySync = journey => supabase
    .from("profiles")
    .update({ journey })
    .eq("id", user.id);
  window.addEventListener("plusu:journey", async event => {
    const { error: journeyError } = await journeySync(event.detail);
    if (journeyError) {
      console.error("Could not save the member journey.", journeyError);
    }
  });

  try {
    const savedJourney = localStorage.getItem("plusu-welcome");
    if (savedJourney) {
      const { error: journeyError } = await journeySync(JSON.parse(savedJourney));
      if (journeyError) {
        console.error("Could not restore the member journey.", journeyError);
      }
    }
  } catch {
    // Local storage is optional; a signed-in member can still continue without it.
  }
}

loadAuth().catch(() => {
  if (isConfigured()) {
    signInPanel.hidden = false;
    setStatus("Sign-in is temporarily unavailable. Please try again shortly.");
  }
});
