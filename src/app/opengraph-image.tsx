import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDogs } from "@/lib/dogs";
import { ASSETS } from "@/lib/assets";

/**
 * The card people see when this link is pasted into a text, a Facebook post or a DM.
 *
 * Built rather than picked: left alone, the platforms grab whichever photo they find
 * first, which is how a share ended up as one dog in a cone with no context. This puts
 * the mark, the real number of dogs waiting, and four of their faces in every share.
 */

export const alt =
  "The CrAZy Dog People. Dogs on the Maricopa County priority list have days, not weeks.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 1800;

export default async function OpengraphImage() {
  const [{ active }, archivo, inter] = await Promise.all([
    getDogs(),
    readFile(join(process.cwd(), "src/og/archivo-800.ttf")),
    readFile(join(process.cwd(), "src/og/inter-600.ttf")),
  ]);

  const faces = active.filter((d) => d.photo).slice(0, 4);
  const waiting = active.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fbf4e9",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "48px 60px 34px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.logoHorizontal} width={330} height={82} alt="" />

          <div
            style={{
              display: "flex",
              fontFamily: "Archivo",
              fontSize: 70,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "#111111",
              marginTop: 30,
              maxWidth: 1010,
            }}
          >
            {waiting > 0
              ? `${waiting} dogs in Phoenix have days, not weeks.`
              : "Dogs in Phoenix have days, not weeks."}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontSize: 31,
              color: "#3d3a35",
              marginTop: 22,
            }}
          >
            Apply once. Open your door. thecrazydogpeople.com
          </div>
        </div>

        <div style={{ display: "flex", height: 224, width: "100%" }}>
          {faces.map((dog) => (
            <div
              key={dog.id}
              style={{
                display: "flex",
                flex: 1,
                height: "100%",
                overflow: "hidden",
                borderRight: "5px solid #fbf4e9",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dog.photo!}
                alt=""
                width={300}
                height={224}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", height: 18, backgroundColor: "#c85030" }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Inter", data: inter, weight: 600, style: "normal" },
      ],
    }
  );
}
