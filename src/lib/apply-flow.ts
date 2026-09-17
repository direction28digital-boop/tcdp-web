/**
 * The foster application, matched against the live WPForms form on dogfoster.org
 * (form_id 119, 80 fields over 7 pages, captured 2026-09-12).
 *
 * WHAT CHANGED AND WHAT DID NOT. The old form asked all of this AGAIN, in full,
 * for every dog a person was interested in, because it opened with "Dog name or
 * ID #". Three dogs meant roughly 150 questions. So the fix was never to ask
 * less. It was to ask ONCE. The question set here is theirs, near enough
 * one for one, and most of it is conditional, so the median applicant sees far
 * fewer than the full list.
 *
 * Four deliberate differences, all agreed with Dee 2026-09-12:
 *
 *   1. WHICH DOG is a choice, not a text box. "A specific dog" reveals the
 *      name-or-ID field; "any dog I can help" is a real stored value. The old
 *      form's free-text box is why the team could never sort their queue, and
 *      prefilling it with the word "Any" would just fill the queue with the
 *      string "Any". People who will take any dog are exactly who the dogs
 *      nobody asked about need, so that answer has to be countable.
 *   2. ARIZONA is asked, not just noted in red. Their form puts it in a note
 *      above the first field, so somebody out of state can answer fifty
 *      questions before anyone tells them no.
 *   3. THE HEALTH QUESTION IS REWRITTEN. Theirs asks whether you have a medical
 *      or physical condition and then asks you to describe your limitations.
 *      That stores a stranger's medical information in a database to answer a
 *      question about matching. Asked as "anything we should know when matching
 *      you", it gets the same useful answer and collects no diagnosis.
 *   4. YARD PHOTOS are not here yet. Their form uploads images of the yard.
 *      That needs its own storage bucket and policies, and a half-wired upload
 *      is worse than none, so it lands in the next pass rather than this one.
 *
 * Kept at Dee's instruction after being cut in the August draft: breeds you are
 * most interested in, and how long you can foster.
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
    | "number"
    | "date"
    | "repeater";
  required?: boolean;
  help?: string;
  options?: string[];
  placeholder?: string;
  /** Show this field only when another field has one of these values. */
  showWhen?: { field: string; equals: string[] };
  width?: "full" | "half";
  /** repeater only: the fields repeated per row. */
  fields?: Field[];
  /** repeater only: the button text, e.g. "Add another person". */
  addLabel?: string;
  /** repeater only: hard cap, so nobody adds two hundred rows. */
  max?: number;
};

/** One row inside a repeater, e.g. one household member or one resident dog. */
export type AnswerRow = Record<string, string>;
export type AnswerValue = string | string[] | AnswerRow[];
/** Keyed by Field.id. This shape is what lands in applications.answers. */
export type Answers = Record<string, AnswerValue>;

export type Step = {
  id: string;
  title: string;
  intro?: string;
  fields: Field[];
};

const YES_NO = ["Yes", "No"];

export const APPLY_STEPS: Step[] = [
  {
    id: "start",
    title: "Before we start",
    intro:
      "Two quick things, then the application. You fill this in once and never again.",
    fields: [
      {
        id: "azResident",
        label: "Do you live in Arizona?",
        type: "radio",
        options: YES_NO,
        required: true,
        help: "Our dogs are in Maricopa County shelters, so fosters have to be local. We would rather tell you now than after fifty questions.",
      },
      {
        id: "dogInterest",
        label: "Which dog brought you here?",
        type: "radio",
        options: ["A specific dog", "Any dog I can help"],
        required: true,
        showWhen: { field: "azResident", equals: ["Yes"] },
      },
      {
        id: "dogIdentifier",
        label: "Their name or ID number",
        type: "text",
        placeholder: "Roger, or A5168681",
        showWhen: { field: "dogInterest", equals: ["A specific dog"] },
        help: "Whatever you have is fine. The ID is the letter and numbers on the shelter's listing.",
      },
    ],
  },

  {
    id: "you",
    title: "You",
    fields: [
      { id: "firstName", label: "First name", type: "text", required: true, width: "half" },
      { id: "lastName", label: "Last name", type: "text", required: true, width: "half" },
      { id: "email", label: "Email", type: "email", required: true, width: "half" },
      { id: "phone", label: "Phone", type: "tel", required: true, width: "half" },
      {
        id: "textOk",
        label: "Can we text this number?",
        type: "radio",
        options: ["Yes", "Call me instead"],
        required: true,
        help: "When a dog has two days left, a text gets answered and a phone call does not.",
      },
      {
        id: "altEmails",
        label: "Any other email addresses?",
        type: "repeater",
        addLabel: "Add another email",
        max: 3,
        fields: [
          { id: "email", label: "Email", type: "email", width: "half" },
          {
            id: "type",
            label: "Type",
            type: "select",
            options: ["Personal", "Work", "Shared with my partner", "Other"],
            width: "half",
          },
        ],
      },
      { id: "address", label: "Street address", type: "text", required: true },
      { id: "city", label: "City", type: "text", required: true, width: "half" },
      { id: "zip", label: "Zip code", type: "text", required: true, width: "half" },
      { id: "retired", label: "Are you retired?", type: "radio", options: YES_NO, required: true, width: "half" },
      { id: "worksFromHome", label: "Do you work from home?", type: "radio", options: YES_NO, required: true, width: "half" },
      {
        id: "otherPeople",
        label: "Is there anybody else living in your home?",
        type: "radio",
        options: YES_NO,
        required: true,
      },
      {
        id: "householdMembers",
        label: "Who else is at home",
        type: "repeater",
        addLabel: "Add another person",
        max: 12,
        showWhen: { field: "otherPeople", equals: ["Yes"] },
        help: "Everyone in the house, including children, with their ages.",
        fields: [
          { id: "name", label: "Name", type: "text", width: "half" },
          { id: "age", label: "Age", type: "number", width: "half" },
          { id: "relationship", label: "Relationship to you", type: "text" },
        ],
      },
      { id: "emergencyName", label: "Emergency contact name", type: "text", required: true, width: "half" },
      { id: "emergencyRelationship", label: "Their relationship to you", type: "text", required: true, width: "half" },
      { id: "emergencyPhone", label: "Emergency contact phone", type: "tel", required: true, width: "half" },
    ],
  },

  {
    id: "home",
    title: "Your home",
    fields: [
      {
        id: "consideringAdoption",
        label: "Would you consider adopting, not just fostering?",
        type: "radio",
        options: ["Yes", "No", "Maybe, depending on the dog"],
        required: true,
        help: "Either answer is a good answer. Fostering is what gets a dog out alive.",
      },
      {
        id: "healthNote",
        label: "Anything about your health or mobility we should know when matching you with a dog?",
        type: "textarea",
        help: "Only what affects the match, like stairs, pulling on a leash, or lifting. Skip it if there is nothing.",
      },
      {
        id: "housing",
        label: "Do you rent or own?",
        type: "radio",
        options: ["I own", "I rent", "I live with family"],
        required: true,
      },
      {
        id: "landlordOk",
        label: "Has your landlord agreed to a dog?",
        type: "radio",
        options: ["Yes", "Not yet", "Pets are already allowed in my lease"],
        required: true,
        showWhen: { field: "housing", equals: ["I rent", "I live with family"] },
      },
      {
        id: "breedRestrictions",
        label: "Does your lease or insurance restrict any breeds?",
        type: "radio",
        options: ["No", "Yes", "I am not sure yet"],
        required: true,
        showWhen: { field: "housing", equals: ["I rent", "I live with family"] },
      },
      {
        id: "breedsNotAllowed",
        label: "Which ones are not allowed?",
        type: "checkbox",
        options: ["Pit bull type", "German Shepherd", "Rottweiler", "Doberman", "Husky", "Chow", "Akita", "Mastiff"],
        showWhen: { field: "breedRestrictions", equals: ["Yes"] },
        help: "We flag these rather than hiding dogs, because shelter breed labels are a staff guess from looking at the dog.",
      },
      {
        id: "additionalBreeds",
        label: "Any others, in your own words",
        type: "text",
        showWhen: { field: "breedRestrictions", equals: ["Yes"] },
      },
      {
        id: "weightRestrictions",
        label: "Is there a weight limit?",
        type: "radio",
        options: ["No", "Yes", "I am not sure yet"],
        required: true,
        showWhen: { field: "housing", equals: ["I rent", "I live with family"] },
      },
      {
        id: "weightLimit",
        label: "What is the limit?",
        type: "select",
        options: ["Under 25 lb", "Under 40 lb", "Under 50 lb", "Under 75 lb"],
        showWhen: { field: "weightRestrictions", equals: ["Yes"] },
        help: "This one is a fact rather than a guess, so we only show you dogs under it.",
      },
      { id: "yard", label: "Do you have a fenced yard?", type: "radio", options: YES_NO, required: true },
      {
        id: "fenceType",
        label: "What type of fence?",
        type: "select",
        options: ["Block or masonry", "Wood", "Chain link", "Wrought iron", "Vinyl", "Other"],
        showWhen: { field: "yard", equals: ["Yes"] },
        width: "half",
      },
      {
        id: "fenceTypeOther",
        label: "Please specify",
        type: "text",
        showWhen: { field: "fenceType", equals: ["Other"] },
        width: "half",
      },
      {
        id: "fenceHeight",
        label: "Roughly how high, in feet?",
        type: "select",
        options: ["Under 4", "4", "5", "6", "Over 6"],
        showWhen: { field: "yard", equals: ["Yes"] },
        width: "half",
      },
      { id: "stairs", label: "Are there stairs the dog would have to use?", type: "radio", options: YES_NO, required: true },
      {
        id: "household",
        label: "What is your home like day to day?",
        type: "checkbox",
        options: [
          "Quiet and calm",
          "Busy, people coming and going",
          "Children at home",
          "Other pets at home",
          "Someone home most of the time",
          "Out at work most of the day",
        ],
        required: true,
      },
    ],
  },

  {
    id: "dogs",
    title: "The dogs you can help",
    fields: [
      {
        id: "size",
        label: "Size you can take",
        type: "checkbox",
        options: ["Small", "Medium", "Large", "Any size"],
        required: true,
      },
      { id: "sex", label: "Any preference on male or female?", type: "radio", options: ["Male", "Female", "No preference"], required: true },
      {
        id: "breedInterest",
        label: "Any breeds you are especially drawn to?",
        type: "radio",
        options: YES_NO,
        required: true,
        help: "We will keep it in mind, but shelter breed labels are a guess, so we match mostly on size and temperament.",
      },
      {
        id: "breedsInterested",
        label: "Which ones?",
        type: "textarea",
        showWhen: { field: "breedInterest", equals: ["Yes"] },
      },
      {
        id: "howLong",
        label: "How long can you foster?",
        type: "radio",
        options: [
          "Until they are adopted, however long that takes",
          "A few months",
          "A few weeks",
          "It depends, let us talk",
        ],
        required: true,
        help: "We have no facility, so a foster dog stays with you until they are adopted. Months, not days, is the honest answer.",
      },
      {
        id: "howLongOther",
        label: "Tell us more",
        type: "text",
        showWhen: { field: "howLong", equals: ["It depends, let us talk"] },
      },
    ],
  },

  {
    id: "experience",
    title: "Your experience",
    fields: [
      { id: "fosteredBefore", label: "Have you fostered before?", type: "radio", options: YES_NO, required: true },
      {
        id: "rescueName",
        label: "Which rescue?",
        type: "text",
        showWhen: { field: "fosteredBefore", equals: ["Yes"] },
      },
      { id: "everyoneAgrees", label: "Is everyone in the house on board?", type: "radio", options: YES_NO, required: true },
      {
        id: "sightUnseen",
        label: "Would you take a dog on our word, without meeting them first?",
        type: "radio",
        options: ["Yes", "No", "Depends on the dog"],
        required: true,
        help: "Sometimes there is no time for a meet and greet. Saying no here does not count against you.",
      },
      {
        id: "whoIsHome",
        label: "How often is somebody home?",
        type: "radio",
        options: [
          "Rarely, less than 2 hours a day",
          "Occasionally, 2 to 4 hours a day",
          "Part-time, 4 to 6 hours a day",
          "Full-time, 7 to 9 hours a day",
          "Most of the time, 10 hours or more",
        ],
        required: true,
      },
      { id: "expReactive", label: "Any experience with reactive dogs?", type: "radio", options: YES_NO, required: true, width: "half" },
      { id: "expFearful", label: "With fearful or anxious dogs?", type: "radio", options: YES_NO, required: true, width: "half" },
      { id: "expPregnant", label: "With pregnant dogs?", type: "radio", options: YES_NO, required: true, width: "half" },
      {
        id: "crateForCar",
        label: "Do you have a crate that fits your car?",
        type: "radio",
        options: ["Yes", "No", "I can borrow one"],
        required: true,
        width: "half",
        help: "For collecting them from the shelter.",
      },
      {
        id: "transport",
        label: "Can you get to the shelter to collect a dog?",
        type: "radio",
        options: ["Yes", "No, I would need transport help"],
        required: true,
      },
    ],
  },

  {
    id: "pets",
    title: "Your pets",
    fields: [
      { id: "dogsInHome", label: "Are there dogs at home already?", type: "radio", options: YES_NO, required: true },
      {
        id: "dogCount",
        label: "How many?",
        type: "select",
        options: ["1", "2", "3", "4", "5 or more"],
        showWhen: { field: "dogsInHome", equals: ["Yes"] },
        width: "half",
      },
      {
        id: "residentDogs",
        label: "Tell us about them",
        type: "repeater",
        addLabel: "Add another dog",
        max: 8,
        showWhen: { field: "dogsInHome", equals: ["Yes"] },
        fields: [
          { id: "breed", label: "Breed", type: "text", width: "half" },
          {
            id: "age",
            label: "Age",
            type: "select",
            options: ["Under 1 year", "1 to 3", "4 to 7", "8 to 10", "Over 10"],
            width: "half",
          },
          { id: "fixed", label: "Spayed or neutered?", type: "radio", options: ["Yes", "No", "Not sure"], width: "half" },
          { id: "vaccinated", label: "Up to date on vaccinations?", type: "radio", options: ["Yes", "No", "Not sure"], width: "half" },
        ],
      },
      {
        id: "separate",
        label: "Could you keep a new dog separate from them for two weeks?",
        type: "radio",
        options: YES_NO,
        required: true,
        showWhen: { field: "dogsInHome", equals: ["Yes"] },
        help: "A slow introduction is how most of these go well.",
      },
      { id: "catsInHome", label: "Are there cats at home?", type: "radio", options: YES_NO, required: true },
      {
        id: "catCount",
        label: "How many?",
        type: "select",
        options: ["1", "2", "3 or more"],
        showWhen: { field: "catsInHome", equals: ["Yes"] },
        width: "half",
      },
    ],
  },

  {
    id: "done",
    title: "Last bit",
    fields: [
      { id: "tripsPlanned", label: "Any trips planned?", type: "radio", options: YES_NO, required: true },
      {
        id: "tripDates",
        label: "When are you away? Approximate is fine",
        type: "repeater",
        addLabel: "Add another trip",
        max: 6,
        showWhen: { field: "tripsPlanned", equals: ["Yes"] },
        fields: [
          { id: "start", label: "From", type: "date", width: "half" },
          { id: "end", label: "Until", type: "date", width: "half" },
        ],
      },
      {
        id: "medicalProcedures",
        label: "Anything scheduled in the next six months that would stop you caring for a foster dog?",
        type: "radio",
        options: YES_NO,
        required: true,
        help: "Surgery, a move, a new baby. We are asking about timing, not details.",
      },
      {
        id: "heardAbout",
        label: "How did you hear about us, or about this dog?",
        type: "radio",
        options: ["Facebook", "A friend", "The shelter", "A flyer", "Search", "Somewhere else"],
        required: true,
      },
      {
        id: "heardAboutOther",
        label: "Where?",
        type: "text",
        showWhen: { field: "heardAbout", equals: ["Somewhere else"] },
      },
      { id: "anythingElse", label: "Anything you want us to know?", type: "textarea" },
      {
        id: "terms",
        label: "Before you send it",
        type: "checkbox",
        options: [
          "Everything here is true to the best of my knowledge, and I understand fostering means keeping the dog until they are adopted.",
        ],
        required: true,
      },
    ],
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
