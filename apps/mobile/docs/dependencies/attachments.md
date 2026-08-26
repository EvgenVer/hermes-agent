# Document and image attachment dependencies

Checked on 2026-08-26. This bundle covers user-selected files and images for
chat attachments. It does not grant the mobile client permission to inspect
arbitrary storage or bypass the server's type/size validation.

## Registry and platform evidence

| Package | Identity and compatibility | License/type | Decision |
| --- | --- | --- | --- |
| [`expo-document-picker`](https://www.npmjs.com/package/expo-document-picker) | Official Expo module; SDK 57 documentation recommends `~57.0.1`; uses the Android/iOS system document picker and has a config plugin. | MIT; native runtime package. | Accept `~57.0.1`. |
| [`expo-image-picker`](https://www.npmjs.com/package/expo-image-picker) | Official Expo module; SDK 57 documentation recommends the `~57.0.13` patch line; provides library selection and optional camera access. | MIT; native runtime/config-plugin package. | Accept `~57.0.13`. |

Primary references are [DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
and [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/).
Both packages are maintained in the Expo SDK release line and must be added
with `npx expo install`.

## URI, type, and size handling

The picker returns a local URI plus metadata where available (`fileName`,
`fileSize`, and `mimeType`). The client copies or retains the selected content
only long enough to construct the server upload request, validates the declared
type/size before upload, and treats MIME metadata as advisory: the server is
the final validator. Content URIs and temporary cache files must be handled as
opaque values; the client must not derive authorization from a filename or URI.

The Stage 1 validation policy mirrors the API matrix:

- image attachments: 25 MiB maximum;
- PDF attachments: 50 MiB and 25 pages maximum;
- avatar asset: 2 MiB maximum;
- generic `file.attach`: no explicit byte cap exists in the merged server
  baseline, so the client must not invent a falsely authoritative cap. The
  server-contract extension must define it before generic-file UX is enabled.

The client should reject an obviously oversized local file before network I/O,
but it must still display and handle server rejection. A missing size or MIME
value is not permission to upload unlimited content; the upload path applies a
bounded stream/request policy and lets the server decide.

## Android permissions and privacy

DocumentPicker uses the system picker and does not require broad storage
access. Image library selection uses the system permission flow. The ImagePicker
config plugin can add camera, storage, and microphone permissions; Stage 1 does
not need microphone capture, so the generated config must set the microphone
permission option off unless a later approved feature requires it. Camera
permission is requested only if camera capture is actually exposed.

Selected content is not placed in logs, SQLite, push payloads, React Query
cache entries, or error messages. Attachment upload requests use the
authenticated transport, one submit per user action, and an authoritative
server response. A timeout after submit is ambiguous and must not be retried
automatically without a server idempotency/reconciliation contract.

## Decision

**Accept `expo-document-picker~57.0.1` and `expo-image-picker~57.0.13`.** Use
system/content URIs, explicit client preflight, server-side final validation,
and least-privilege Android permissions. Do not add a filesystem browser,
camera library, or broad storage permission package.
