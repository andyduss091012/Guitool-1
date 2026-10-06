import type { ScaleConcept } from '../../types/musicConcept'

/**
 * Scale concepts. Each shape's fret/string data was computed programmatically
 * from open-string pitch class + fret number (not typed from memory) before
 * being written here — see the note in the README under "Notes & known
 * limitations" for why that matters for content like this.
 *
 * Shape numbering follows the widely-taught 5-position system: shapes are
 * numbered in the order they sit up the neck for a given root, wrapping
 * back to shape 1 an octave higher. Shape 1 here matches the box shape
 * already used by `scales-minor-pentatonic` in `data/exercises.ts` before
 * this system existed, so migrating that exercise to reference this concept
 * doesn't change what a learner who already knows box 1 sees.
 *
 * Every `interval` label below was computed the same programmatic way as
 * the fret/string data itself: `(openStringPitchClass + fret - rootPitchClass)
 * mod 12`, mapped through the standard pentatonic-minor (1, b3, 4, 5, b7) or
 * pentatonic-major (1, 2, 3, 5, 6) degree formula — not typed from memory —
 * then cross-checked against which notes were already hand-marked `root`.
 */

export const SCALE_CONCEPTS: ScaleConcept[] = [
  {
    id: 'scale-minor-pentatonic',
    type: 'scale',
    name: 'Minor Pentatonic Scale',
    family: 'pentatonic',
    aliases: ['minor pentatonic', 'pentatonic minor'],
    description: { en: 'The five-note scale behind most rock, blues and pop lead playing. Shown here in all five positions (root shown is A) — the whole point of the neck, not just one box.', vi: 'Scale 5 nốt đứng sau hầu hết các đoạn lead rock, blues và pop. Ở đây trình bày cả năm vị trí (âm chủ hiển thị là A) — trọn vẹn cả cần đàn, không chỉ một box.', ja: 'ロック、ブルース、ポップのリードプレイの大半を支える5音のスケール。ここでは5つのポジションすべて(表示されているルートはA)を紹介する――ネック全体を使うのがこのスケールの本質であり、1つのボックスだけではない。', zh: '大多数摇滚、蓝调和流行主奏吉他背后的五音音阶。这里展示全部五个把位（根音以A为例）——这才是遍布整条指板的完整用法，而不只是一个箱型。', es: 'La escala de cinco notas detrás de la mayoría de los solos de rock, blues y pop. Aquí se muestra en sus cinco posiciones (la fundamental mostrada es A): esa es toda la gracia del mástil, no solo una posición.' },
    shapes: [
      {
        id: 'shape-1',
        label: 'Shape 1',
        startFret: 5,
        fretCount: 4,
        positions: [
          { string: 1, fret: 5, finger: 1, role: 'root', interval: '1' },
          { string: 1, fret: 8, finger: 4, role: 'note', interval: 'b3' },
          { string: 2, fret: 5, finger: 1, role: 'note', interval: '4' },
          { string: 2, fret: 7, finger: 3, role: 'note', interval: '5' },
          { string: 3, fret: 5, finger: 1, role: 'note', interval: 'b7' },
          { string: 3, fret: 7, finger: 3, role: 'root', interval: '1' },
          { string: 4, fret: 5, finger: 1, role: 'note', interval: 'b3' },
          { string: 4, fret: 7, finger: 3, role: 'note', interval: '4' },
          { string: 5, fret: 5, finger: 1, role: 'note', interval: '5' },
          { string: 5, fret: 8, finger: 4, role: 'note', interval: 'b7' },
          { string: 6, fret: 5, finger: 1, role: 'root', interval: '1' },
          { string: 6, fret: 8, finger: 4, role: 'note', interval: 'b3' },
        ],
        caption: { en: 'The box shape most players learn first — root on the low E and high e strings under finger 1.', vi: 'Thế box mà hầu hết người chơi học đầu tiên — âm chủ trên dây E trầm và dây e cao dưới ngón 1.', ja: 'ほとんどの人が最初に覚えるボックスの形――ルートは1指の下、低いE弦と高いe弦にある。', zh: '大多数人最先学会的箱型——根音在低音E弦和高音e弦上，由食指按住。', es: 'La posición que la mayoría de los guitarristas aprende primero: fundamental en las cuerdas E grave y e aguda bajo el dedo 1.' },
      },
      {
        id: 'shape-2',
        label: 'Shape 2',
        startFret: 7,
        fretCount: 4,
        positions: [
          { string: 1, fret: 8, finger: 2, role: 'note', interval: 'b3' },
          { string: 1, fret: 10, finger: 4, role: 'note', interval: '4' },
          { string: 2, fret: 7, finger: 1, role: 'note', interval: '5' },
          { string: 2, fret: 10, finger: 4, role: 'note', interval: 'b7' },
          { string: 3, fret: 7, finger: 1, role: 'root', interval: '1' },
          { string: 3, fret: 10, finger: 4, role: 'note', interval: 'b3' },
          { string: 4, fret: 7, finger: 1, role: 'note', interval: '4' },
          { string: 4, fret: 9, finger: 3, role: 'note', interval: '5' },
          { string: 5, fret: 8, finger: 2, role: 'note', interval: 'b7' },
          { string: 5, fret: 10, finger: 4, role: 'root', interval: '1' },
          { string: 6, fret: 8, finger: 2, role: 'note', interval: 'b3' },
          { string: 6, fret: 10, finger: 4, role: 'note', interval: '4' },
        ],
        caption: { en: 'Connects directly onto the top of shape 1 — root now falls on the D and B strings.', vi: 'Nối trực tiếp lên đỉnh của thế 1 — âm chủ giờ nằm trên dây D và dây B.', ja: '形1の上部に直接つながる――ルートは今度はD弦とB弦にある。', zh: '直接衔接在第一箱型的上方——根音这时落在D弦和B弦上。', es: 'Se conecta directamente con la parte superior de la posición 1: la fundamental ahora recae en las cuerdas D y B.' },
      },
      {
        id: 'shape-3',
        label: 'Shape 3',
        startFret: 9,
        fretCount: 5,
        positions: [
          { string: 1, fret: 10, finger: 2, role: 'note', interval: '4' },
          { string: 1, fret: 12, finger: 4, role: 'note', interval: '5' },
          { string: 2, fret: 10, finger: 2, role: 'note', interval: 'b7' },
          { string: 2, fret: 12, finger: 4, role: 'root', interval: '1' },
          { string: 3, fret: 10, finger: 2, role: 'note', interval: 'b3' },
          { string: 3, fret: 12, finger: 4, role: 'note', interval: '4' },
          { string: 4, fret: 9, finger: 1, role: 'note', interval: '5' },
          { string: 4, fret: 12, finger: 4, role: 'note', interval: 'b7' },
          { string: 5, fret: 10, finger: 2, role: 'root', interval: '1' },
          { string: 5, fret: 13, finger: 4, role: 'note', interval: 'b3' },
          { string: 6, fret: 10, finger: 2, role: 'note', interval: '4' },
          { string: 6, fret: 12, finger: 4, role: 'note', interval: '5' },
        ],
        caption: { en: 'A wider, 5-fret stretch shape — the finger numbers shown are one reasonable option, not the only one.', vi: 'Một thế giãn rộng hơn, trải 5 phím — các số ngón hiển thị chỉ là một lựa chọn hợp lý, không phải duy nhất.', ja: '5フレット分のストレッチが必要な、より幅の広い形――表示されている指番号は1つの妥当な選択肢であり、唯一の正解ではない。', zh: '一个跨度更宽、需要横跨5品的伸展指型——图中标注的指法只是一种合理选择，并非唯一方案。', es: 'Una posición más amplia, con un estiramiento de 5 trastes: los números de dedo mostrados son una opción razonable, no la única.' },
      },
      {
        id: 'shape-4',
        label: 'Shape 4',
        startFret: 12,
        fretCount: 4,
        positions: [
          { string: 1, fret: 12, finger: 1, role: 'note', interval: '5' },
          { string: 1, fret: 15, finger: 4, role: 'note', interval: 'b7' },
          { string: 2, fret: 12, finger: 1, role: 'root', interval: '1' },
          { string: 2, fret: 15, finger: 4, role: 'note', interval: 'b3' },
          { string: 3, fret: 12, finger: 1, role: 'note', interval: '4' },
          { string: 3, fret: 14, finger: 3, role: 'note', interval: '5' },
          { string: 4, fret: 12, finger: 1, role: 'note', interval: 'b7' },
          { string: 4, fret: 14, finger: 3, role: 'root', interval: '1' },
          { string: 5, fret: 13, finger: 2, role: 'note', interval: 'b3' },
          { string: 5, fret: 15, finger: 4, role: 'note', interval: '4' },
          { string: 6, fret: 12, finger: 1, role: 'note', interval: '5' },
          { string: 6, fret: 15, finger: 4, role: 'note', interval: 'b7' },
        ],
        caption: { en: 'Root on the A and G strings. One octave up from here (fret 17) is shape 1 again.', vi: 'Âm chủ trên dây A và dây G. Đi lên một quãng 8 từ đây (phím 17) lại là thế 1.', ja: 'ルートはA弦とG弦にある。ここから1オクターブ上(17フレット)へ行くと再び形1になる。', zh: '根音在A弦和G弦上。从这里往上一个八度（第17品）又会回到第一箱型。', es: 'Fundamental en las cuerdas A y G. Una octava más arriba desde aquí (traste 17) vuelve a estar la posición 1.' },
      },
      {
        id: 'shape-5',
        label: 'Shape 5',
        startFret: 2,
        fretCount: 4,
        positions: [
          { string: 1, fret: 3, finger: 2, role: 'note', interval: 'b7' },
          { string: 1, fret: 5, finger: 4, role: 'root', interval: '1' },
          { string: 2, fret: 3, finger: 2, role: 'note', interval: 'b3' },
          { string: 2, fret: 5, finger: 4, role: 'note', interval: '4' },
          { string: 3, fret: 2, finger: 1, role: 'note', interval: '5' },
          { string: 3, fret: 5, finger: 4, role: 'note', interval: 'b7' },
          { string: 4, fret: 2, finger: 1, role: 'root', interval: '1' },
          { string: 4, fret: 5, finger: 4, role: 'note', interval: 'b3' },
          { string: 5, fret: 3, finger: 2, role: 'note', interval: '4' },
          { string: 5, fret: 5, finger: 4, role: 'note', interval: '5' },
          { string: 6, fret: 3, finger: 2, role: 'note', interval: 'b7' },
          { string: 6, fret: 5, finger: 4, role: 'root', interval: '1' },
        ],
        caption: { en: 'Sits just below shape 1 — its top notes connect straight into shape 1\'s bottom notes.', vi: 'Nằm ngay phía dưới thế 1 — các nốt trên cùng của nó nối thẳng vào các nốt dưới cùng của thế 1.', ja: '形1のすぐ下に位置する――一番上の音が形1の一番下の音へそのままつながる。', zh: '位于第一箱型正下方——它的最高音直接衔接到第一箱型的最低音。', es: 'Se sitúa justo debajo de la posición 1: sus notas superiores se conectan directamente con las notas inferiores de la posición 1.' },
      },
    ],
  },
  {
    id: 'scale-major-pentatonic',
    type: 'scale',
    name: 'Major Pentatonic Scale',
    family: 'pentatonic',
    aliases: ['major pentatonic', 'pentatonic major'],
    description: { en: 'The bright, upbeat cousin of the minor pentatonic — same five-note-per-octave shape logic, different starting point. Shown here in all five positions (root shown is G).', vi: 'Người anh em tươi sáng, lạc quan của minor pentatonic — cùng logic thế 5-nốt-mỗi-quãng-8, nhưng khác điểm bắt đầu. Ở đây trình bày cả năm vị trí (âm chủ hiển thị là G).', ja: 'マイナーペンタトニックの明るく前向きな仲間――同じ『1オクターブに5音』という形の論理を持ちながら、出発点が異なる。ここでは5つのポジションすべて(表示されているルートはG)を紹介する。', zh: '小调五声音阶明亮欢快的「姐妹音阶」——同样是每八度五个音的指型逻辑，只是起点不同。这里展示全部五个把位（根音以G为例）。', es: 'La prima brillante y animada de la pentatónica menor: la misma lógica de forma de cinco notas por octava, con un punto de partida diferente. Aquí se muestra en sus cinco posiciones (la fundamental mostrada es G).' },
    shapes: [
      {
        id: 'shape-1',
        label: 'Shape 1',
        startFret: 0,
        fretCount: 4,
        positions: [
          { string: 1, fret: 0, role: 'note', interval: '6' },
          { string: 1, fret: 3, finger: 3, role: 'root', interval: '1' },
          { string: 2, fret: 0, role: 'note', interval: '2' },
          { string: 2, fret: 2, finger: 2, role: 'note', interval: '3' },
          { string: 3, fret: 0, role: 'note', interval: '5' },
          { string: 3, fret: 2, finger: 2, role: 'note', interval: '6' },
          { string: 4, fret: 0, role: 'root', interval: '1' },
          { string: 4, fret: 2, finger: 2, role: 'note', interval: '2' },
          { string: 5, fret: 0, role: 'note', interval: '3' },
          { string: 5, fret: 3, finger: 3, role: 'note', interval: '5' },
          { string: 6, fret: 0, role: 'note', interval: '6' },
          { string: 6, fret: 3, finger: 3, role: 'root', interval: '1' },
        ],
        caption: { en: 'Open-position shape — mixes open strings with frets 2–3. Root on the open G string and fret 3 of the outer strings.', vi: 'Thế ở vị trí mở — kết hợp dây buông với phím 2-3. Âm chủ trên dây G buông và phím 3 của các dây ngoài cùng.', ja: '開放ポジションの形――開放弦と2〜3フレットが混ざる。ルートは開放G弦と外側の弦の3フレットにある。', zh: '开放把位指型——混合了空弦与第2、3品的按音。根音在G空弦以及外侧两弦的第3品上。', es: 'Posición en posición abierta: mezcla cuerdas al aire con los trastes 2-3. Fundamental en la cuerda G al aire y en el traste 3 de las cuerdas exteriores.' },
      },
      {
        id: 'shape-2',
        label: 'Shape 2',
        startFret: 2,
        fretCount: 4,
        positions: [
          { string: 1, fret: 3, finger: 2, role: 'root', interval: '1' },
          { string: 1, fret: 5, finger: 4, role: 'note', interval: '2' },
          { string: 2, fret: 2, finger: 1, role: 'note', interval: '3' },
          { string: 2, fret: 5, finger: 4, role: 'note', interval: '5' },
          { string: 3, fret: 2, finger: 1, role: 'note', interval: '6' },
          { string: 3, fret: 5, finger: 4, role: 'root', interval: '1' },
          { string: 4, fret: 2, finger: 1, role: 'note', interval: '2' },
          { string: 4, fret: 4, finger: 3, role: 'note', interval: '3' },
          { string: 5, fret: 3, finger: 2, role: 'note', interval: '5' },
          { string: 5, fret: 5, finger: 4, role: 'note', interval: '6' },
          { string: 6, fret: 3, finger: 2, role: 'root', interval: '1' },
          { string: 6, fret: 5, finger: 4, role: 'note', interval: '2' },
        ],
        caption: { en: 'Connects onto the top of shape 1 — this is the same box most players already know as minor-pentatonic shape 5, just re-rooted.', vi: 'Nối lên đỉnh của thế 1 — đây chính là box mà hầu hết người chơi đã biết là thế 5 của minor pentatonic, chỉ được đặt lại âm chủ.', ja: '形1の上部につながる――これはマイナーペンタトニックの形5としてすでに知っているのと同じボックスに、新しいルートを当てはめただけのもの。', zh: '衔接在第一箱型的上方——这其实就是大多数人已经熟悉的小调五声音阶第5箱型，只是根音重新定位了。', es: 'Se conecta con la parte superior de la posición 1: es la misma posición que la mayoría ya conoce como posición 5 de la pentatónica menor, solo que con otra fundamental.' },
      },
      {
        id: 'shape-3',
        label: 'Shape 3',
        startFret: 4,
        fretCount: 5,
        positions: [
          { string: 1, fret: 5, finger: 2, role: 'note', interval: '2' },
          { string: 1, fret: 7, finger: 4, role: 'note', interval: '3' },
          { string: 2, fret: 5, finger: 2, role: 'note', interval: '5' },
          { string: 2, fret: 7, finger: 4, role: 'note', interval: '6' },
          { string: 3, fret: 5, finger: 2, role: 'root', interval: '1' },
          { string: 3, fret: 7, finger: 4, role: 'note', interval: '2' },
          { string: 4, fret: 4, finger: 1, role: 'note', interval: '3' },
          { string: 4, fret: 7, finger: 4, role: 'note', interval: '5' },
          { string: 5, fret: 5, finger: 2, role: 'note', interval: '6' },
          { string: 5, fret: 8, finger: 4, role: 'root', interval: '1' },
          { string: 6, fret: 5, finger: 2, role: 'note', interval: '2' },
          { string: 6, fret: 7, finger: 4, role: 'note', interval: '3' },
        ],
        caption: { en: 'A wider stretch shape, like minor-pentatonic shape 3 — finger numbers shown are one reasonable option.', vi: 'Một thế giãn rộng hơn, giống thế 3 của minor pentatonic — các số ngón hiển thị chỉ là một lựa chọn hợp lý.', ja: 'マイナーペンタトニックの形3と同様、より幅の広いストレッチが必要な形――表示されている指番号は1つの妥当な選択肢。', zh: '一个更宽的伸展指型，类似小调五声音阶第3箱型——图中标注的指法只是一种合理选择。', es: 'Una posición de estiramiento más amplia, como la posición 3 de la pentatónica menor: los números de dedo mostrados son una opción razonable.' },
      },
      {
        id: 'shape-4',
        label: 'Shape 4',
        startFret: 7,
        fretCount: 4,
        positions: [
          { string: 1, fret: 7, finger: 1, role: 'note', interval: '3' },
          { string: 1, fret: 10, finger: 4, role: 'note', interval: '5' },
          { string: 2, fret: 7, finger: 1, role: 'note', interval: '6' },
          { string: 2, fret: 10, finger: 4, role: 'root', interval: '1' },
          { string: 3, fret: 7, finger: 1, role: 'note', interval: '2' },
          { string: 3, fret: 9, finger: 3, role: 'note', interval: '3' },
          { string: 4, fret: 7, finger: 1, role: 'note', interval: '5' },
          { string: 4, fret: 9, finger: 3, role: 'note', interval: '6' },
          { string: 5, fret: 8, finger: 2, role: 'root', interval: '1' },
          { string: 5, fret: 10, finger: 4, role: 'note', interval: '2' },
          { string: 6, fret: 7, finger: 1, role: 'note', interval: '3' },
          { string: 6, fret: 10, finger: 4, role: 'note', interval: '5' },
        ],
        caption: { en: 'Root on the A and low/high E strings\' neighbor — this is the CAGED-G shape\'s open-string neighborhood, an octave and a bit up.', vi: 'Âm chủ trên dây A và vùng lân cận của dây E trầm/cao — đây là vùng lân cận dây buông của thế CAGED-G, cao hơn một quãng 8 và một chút.', ja: 'ルートはA弦と低音/高音E弦の隣にある――これはCAGEDのGの形にある開放弦の近辺を、1オクターブと少し上げたもの。', zh: '根音在A弦以及低/高音E弦的邻近位置——这正是CAGED的G型指型附近区域，往上移了一个八度多一点。', es: 'Fundamental en la cuerda A y en la vecina de las cuerdas E grave/aguda: es la zona de cuerdas al aire vecina de la forma CAGED-G, una octava y un poco más arriba.' },
      },
      {
        id: 'shape-5',
        label: 'Shape 5',
        startFret: 9,
        fretCount: 4,
        positions: [
          { string: 1, fret: 10, finger: 2, role: 'note', interval: '5' },
          { string: 1, fret: 12, finger: 4, role: 'note', interval: '6' },
          { string: 2, fret: 10, finger: 2, role: 'root', interval: '1' },
          { string: 2, fret: 12, finger: 4, role: 'note', interval: '2' },
          { string: 3, fret: 9, finger: 1, role: 'note', interval: '3' },
          { string: 3, fret: 12, finger: 4, role: 'note', interval: '5' },
          { string: 4, fret: 9, finger: 1, role: 'note', interval: '6' },
          { string: 4, fret: 12, finger: 4, role: 'root', interval: '1' },
          { string: 5, fret: 10, finger: 2, role: 'note', interval: '2' },
          { string: 5, fret: 12, finger: 4, role: 'note', interval: '3' },
          { string: 6, fret: 10, finger: 2, role: 'note', interval: '5' },
          { string: 6, fret: 12, finger: 4, role: 'note', interval: '6' },
        ],
        caption: { en: 'Sits just below shape 1 an octave up (fret 12 = the octave). Its top notes connect straight into shape 1 again.', vi: 'Nằm ngay dưới thế 1 lên một quãng 8 (phím 12 = quãng 8). Các nốt trên cùng của nó nối thẳng lại vào thế 1.', ja: '形1の1オクターブ上(12フレット=オクターブ)のすぐ下に位置する。一番上の音は再び形1へそのままつながる。', zh: '位于第一箱型往上一个八度处（第12品即为八度）的正下方。它的最高音直接衔接回第一箱型。', es: 'Se sitúa justo debajo de la posición 1 una octava más arriba (el traste 12 es la octava). Sus notas superiores se conectan de nuevo directamente con la posición 1.' },
      },
    ],
  },
]

export function getScaleConcept(id: string): ScaleConcept | undefined {
  return SCALE_CONCEPTS.find((c) => c.id === id)
}
