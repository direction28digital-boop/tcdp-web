/**
 * The proposed apply-once profile.
 *
 * The live WPForms application is 6 pages and roughly 50 questions, asked again in full
 * for every dog a person is interested in. Someone interested in three dogs answers about
 * 150 questions. This is the cut: answer the home once, then about six questions per dog.
 *
 * Three rules decided what stayed:
 *   1. If the answer cannot change whether a dog is placed with this person, it is out.
 *   2. If the answer is only true at the moment a specific dog is in play (dates,
 *      availability, landlord sign-off), it moves to the per-dog step or the phone call.
 *   3. If a rescue needs it only once a dog is actually going home, it moves to placement.
 *
 * Nothing here is deleted from the team's knowledge. It just stops being a wall between
 * a willing person and a dog with four days left.
 */

export type Field = {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "number";
  required?: boolean;
  help?: string;
  options?: string[];
  placeholder?: string;
  /** Show this field only when another field has one of these values. */
  showWhen?: { field: string; equals: string[] };
  width?: "full" | "half";
};

export type Step = {
  id: string;
  title: string;
  intro?: string;
  fields: Field[];
};

export const APPLY_STEPS: Step[] = [
  {
    id: "you",
    title: "You",
    intro:
      "Six short steps. Most people finish in about five minutes, and you never fill this in again.",
    fields: [
      {
        id: "firstName",
        label: "First name",
        type: "text",
        required: true,
        width: "half",
      },
      {
        id: "lastName",
        label: "Last name",
        type: "text",
        required: true,
        width: "half",
      },
      {
        id: "email",
        label: "Email",
        type: "email",
        required: true,
        width: "half",
      },
      {
        id: "phone",
        label: "Phone",
        type: "tel",
        required: true,
        width: "half",
      },
      {
        id: "textOk",
        label: "Can we text this number?",
        type: "radio",
        options: ["Yes", "Call me instead"],
        required: true,
        help: "When a dog has two days left, a text gets answered and a phone call does not.",
      },
      {
        id: "city",
        label: "City",
        type: "text",
        required: true,
        width: "half",
      },
      {
        id: "zip",
        label: "Zip code",
        type: "text",
        required: true,
        width: "half",
      },
      {
        id: "address",
        label: "Street address",
        type: "text",
        help: "Only used when a rescue is arranging a home visit or a handoff. Never shown publicly.",
      },
      {
        id: "emergencyName",
        label: "Emergency contact name",
        type: "text",
        required: true,
        width: "half",
        help: "Someone we can reach about the dog if we cannot reach you.",
      },
      {
        id: "emergencyPhone",
        label: "Emergency contact phone",
        type: "tel",
        required: true,
        width: "half",
      },
      {
        id: "otherAdults",
        label: "Anyone else on the application",
        type: "text",
        placeholder: "Partner, roommate, whoever else lives with you",
        help: "Optional. Just so we know who else may answer the door.",
      },
    ],
  },
  {
    id: "home",
    title: "Your home",
    intro:
      "This is the part that decides which dogs we can show you, so it is worth being exact.",
    fields: [
      {
        id: "housing",
        label: "Do you rent or own?",
        type: "radio",
        options: ["I own", "I rent", "I live with family"],
        required: true,
        help: "Renting is completely normal here. Plenty of our savers rent. We ask so we only show you dogs your lease actually allows.",
      },
      {
        id: "landlordOk",
        label: "Has your landlord agreed to a dog?",
        type: "radio",
        options: ["Yes", "Not yet", "Pets are already allowed in my lease"],
        showWhen: {
          field: "housing",
          equals: ["I rent", "I live with family"],
        },
        required: true,
        help: "Not yet is a fine answer. Plenty of landlords say yes once they understand that the dog belongs to a rescue and the rescue covers the vet bills, and we will help you have that conversation.",
      },
      {
        id: "weightLimit",
        label: "Is there a weight limit?",
        type: "select",
        options: [
          "No weight limit",
          "Under 25 lb",
          "Under 40 lb",
          "Under 50 lb",
          "Under 75 lb",
          "I am not sure yet",
        ],
        showWhen: {
          field: "housing",
          equals: ["I rent", "I live with family"],
        },
        required: true,
        help: "We filter your dog list by this, so you never fall in love with a dog you would not be allowed to keep.",
      },
      {
        id: "breedRestrictions",
        label: "Does your lease or insurance restrict any breeds?",
        type: "checkbox",
        options: [
          "No breed restrictions",
          "Pit bull type",
          "German Shepherd",
          "Rottweiler",
          "Doberman",
          "Husky",
          "Chow",
          "I am not sure yet",
        ],
        showWhen: {
          field: "housing",
          equals: ["I rent", "I live with family"],
        },
        help: "Shelter breed labels are a staff member's best guess from looking at the dog, not a DNA test. We will flag any dog whose label might clash with your lease rather than quietly hiding them, and you decide.",
      },
      {
        id: "yard",
        label: "Do you have a fenced yard?",
        type: "radio",
        options: [
          "Yes, fully fenced",
          "Partly fenced",
          "No yard, we walk on leash",
        ],
        required: true,
        help: "No yard rules nothing out. Plenty of dogs do beautifully in an apartment with a person who walks them.",
      },
      {
        id: "fenceHeight",
        label: "Roughly how high is the fence?",
        type: "select",
        options: ["Under 4 feet", "4 to 5 feet", "6 feet or more", "Not sure"],
        showWhen: {
          field: "yard",
          equals: ["Yes, fully fenced", "Partly fenced"],
        },
      },
      {
        id: "stairs",
        label: "Are there stairs the dog would have to use?",
        type: "radio",
        options: ["No stairs", "A few steps", "Full flight of stairs"],
        help: "Matters for the seniors and the ones recovering from surgery.",
      },
      {
        id: "household",
        label: "What is your home like day to day?",
        type: "radio",
        options: ["Quiet", "In between", "Busy, people in and out"],
        required: true,
      },
      {
        id: "whoIsHome",
        label: "How often is somebody home?",
        type: "select",
        options: [
          "Someone is home most of the day",
          "Out for a normal work day",
          "Out for long stretches",
        ],
        required: true,
      },
    ],
  },
  {
    id: "who",
    title: "Who else is there",
    fields: [
      {
        id: "children",
        label: "Children at home",
        type: "select",
        options: [
          "No children",
          "Children under 5",
          "Children 5 to 12",
          "Teenagers",
          "A mix of ages",
        ],
        required: true,
        help: "Some dogs come with a note from the shelter about kids. This is how we respect it.",
      },
      {
        id: "dogs",
        label: "Dogs already at home",
        type: "select",
        options: ["None", "One", "Two", "Three or more"],
        required: true,
      },
      {
        id: "dogsFixed",
        label: "Are they spayed or neutered and up to date on shots?",
        type: "radio",
        options: ["Yes, all of them", "Not all of them", "Not sure"],
        showWhen: { field: "dogs", equals: ["One", "Two", "Three or more"] },
        required: true,
        help: "Most rescues require this before they will place another dog in the home.",
      },
      {
        id: "separate",
        label: "Could you keep a new dog separate from them for two weeks?",
        type: "radio",
        options: ["Yes", "No", "Not sure"],
        showWhen: { field: "dogs", equals: ["One", "Two", "Three or more"] },
        required: true,
        help: "Two weeks of decompression is the single thing that makes a placement stick.",
      },
      {
        id: "cats",
        label: "Cats at home",
        type: "select",
        options: ["None", "One", "Two or more"],
        required: true,
      },
      {
        id: "everyoneAgrees",
        label: "Is everyone in the house on board?",
        type: "radio",
        options: ["Yes", "Working on it"],
        required: true,
      },
    ],
  },
  {
    id: "experience",
    title: "Your experience",
    intro:
      "There is no wrong answer on this page. First timers save dogs every week.",
    fields: [
      {
        id: "experience",
        label: "How would you describe your experience with dogs?",
        type: "radio",
        options: [
          "First dog",
          "I have had dogs before",
          "I have worked with difficult dogs",
          "Professional, trainer or vet or rescue",
        ],
        required: true,
      },
      {
        id: "fosteredBefore",
        label: "Have you fostered before?",
        type: "radio",
        options: ["No", "Yes", "Yes, with a rescue we could call"],
        required: true,
      },
      {
        id: "comfortable",
        label: "Which of these are you comfortable taking on?",
        type: "checkbox",
        options: [
          "A shy or fearful dog",
          "A dog recovering from surgery or illness",
          "A high energy dog",
          "A dog who needs house training",
          "A pregnant or nursing mother",
          "A senior",
        ],
        help: "Tick only what is true. Every box you leave empty is a dog we will not put you in front of.",
      },
      {
        id: "transport",
        label: "Can you get to the shelter to collect a dog?",
        type: "radio",
        options: [
          "Yes, I can drive",
          "Yes, with a crate if one is lent to me",
          "I would need help with transport",
        ],
        required: true,
        help: "Needing help is fine. We have volunteers who drive.",
      },
    ],
  },
  {
    id: "dogs",
    title: "The dogs you can help",
    intro:
      "This is only a starting filter. You will still choose each dog yourself.",
    fields: [
      {
        id: "size",
        label: "Size you can take",
        type: "checkbox",
        options: ["Small", "Medium", "Large", "Any size"],
        required: true,
      },
      {
        id: "sex",
        label: "Any preference on male or female?",
        type: "radio",
        options: ["No preference", "Male", "Female"],
        required: true,
      },
      {
        id: "sightUnseen",
        label: "Would you take a dog on our word, without meeting them first?",
        type: "radio",
        options: ["Yes", "I would want to meet them", "Depends on the dog"],
        required: true,
        help: "Some of these dogs run out of time before a meeting can be arranged. Saying no here does not cost you anything.",
      },
      {
        /**
         * Joann read the old label, "When should we get in touch?", as a promise that a
         * volunteer would sit there sending messages, and said to cut it because the team
         * all work full time. She was right about the wording. Nothing here is sent by a
         * person: the system watches the deadlines and sends on its own. Relabelled so it
         * cannot be misread as work landing on anybody.
         */
        id: "alerts",
        label: "Automatic alerts",
        type: "checkbox",
        options: [
          "Text me when a dog that fits my home is down to two days",
          "Email me a weekly list of dogs that fit my home",
          "No alerts, I will check the site myself",
        ],
        help: "Nobody on the team sends these. The system watches every dog's deadline around the clock and sends these on its own, which is exactly why we can offer it: the volunteers here all work full time.",
      },
    ],
  },
  {
    id: "done",
    title: "Last bit",
    fields: [
      {
        id: "anythingElse",
        label: "Anything you want us to know?",
        type: "textarea",
        placeholder:
          "Anything at all. A dog you saw, a question, something about your home that does not fit a box.",
      },
      {
        id: "agree",
        label:
          "I understand that these rescues are foster based and have no facility, that I would be this dog's home until they are adopted, usually months, and that a rescue partner makes the final placement decision.",
        type: "radio",
        options: ["I understand"],
        required: true,
      },
    ],
  },
];

/** Everything that used to be asked here and now happens somewhere better. */
export const MOVED = [
  {
    what: "Driver's license upload",
    where: "When a rescue is actually placing a dog",
    why: "Asking for ID before someone has even chosen a dog loses people at question four. The rescue needs it at handover, not at hello.",
  },
  {
    what: "Photos of the yard",
    where: "When a specific dog is in play",
    why: "Most people are on a phone and do not have yard photos ready. A rescue that needs to see the fence can ask that day.",
  },
  {
    what: "Landlord name and phone",
    where: "When a specific dog is in play",
    why: "Kept as a yes or no here, so a renter is never stopped at the door. The rescue verifies when it matters.",
  },
  {
    what: "Trips or surgery planned in the next six months",
    where: "The per-dog step",
    why: "Availability is only true on the day. Asked as: can you start in the next two weeks?",
  },
  {
    what: "Dog name or ID number",
    where: "Replaced entirely by raising your hand on a dog's page",
    why: "This is the whole point. Today it is a free text box holding things like a dash, a full case note, and three dog IDs at once, so nobody can answer who applied for this dog.",
  },
  {
    what: "Second and third phone numbers, second email",
    where: "Staff can add them on the call",
    why: "Almost nobody fills these in, and the team collects them the moment they talk to someone anyway.",
  },
  {
    what: "County",
    where: "Worked out from the zip code",
    why: "One less box.",
  },
  {
    what: "Medical or physical conditions",
    where: "Staff notes on the call",
    why: "It is a health question in a public form. Asked warmly on the phone it gets a better and kinder answer, and it stays out of a database.",
  },
  {
    what: "Breeds you are most interested in",
    where: "Cut",
    why: "Shelter breed labels are guesses. Matching on temperament and size is honest, matching on a label is not.",
  },
  {
    what: "How long can you foster",
    where: "The per-dog step",
    why: "Foster based rescues have no facility, so the dog stays until adoption. The useful question is whether someone can start now, not how many weeks they predict.",
  },
];

/** The roughly six questions asked when someone raises their hand for a dog. */
export const PER_DOG = [
  "Can you start in the next two weeks, and keep the dog until they are adopted?",
  "Have you read what this dog needs?",
  "Anyone in the home who should meet the dog first?",
  "Can you collect the dog, or do you need transport?",
  "Anything about this dog in particular you want to ask?",
  "For renters: is your landlord aware, and can we contact them if a rescue asks?",
];
