import type { ChordConcept } from '../../types/musicConcept'

/**
 * Chord concepts. Every shape's fret/string/role data below was verified
 * programmatically — for the open chords, directly from each chord's root/
 * third/fifth pitch classes; for the CAGED shapes, two independent ways
 * (hand-derived from standard barre-chord theory, then re-derived by
 * transposing each open-chord shape's own fret pattern by the semitone
 * offset needed to land on G) and cross-checked against each other before
 * being written here. See the README's "Notes & known limitations" for why
 * that matters for content like this.
 */

const OPEN_CHORDS: ChordConcept[] = [
  {
    id: 'chord-open-e-major',
    type: 'chord',
    name: 'E major (open)',
    category: 'open',
    description: { en: 'One of the first chords most guitarists learn — full, ringing, and used everywhere in rock.', vi: 'Một trong những hợp âm đầu tiên hầu hết người chơi guitar học — đầy đặn, ngân vang, và xuất hiện khắp nơi trong rock.', ja: 'ほとんどのギタリストが最初に覚えるコードの1つ――豊かに鳴り響き、ロックのあらゆる場面で使われる。', zh: '大多数吉他手最早学会的和弦之一——音色饱满、共鸣十足，在摇滚乐中无处不在。', es: 'Uno de los primeros acordes que aprende la mayoría de los guitarristas: pleno, resonante y usado en todas partes en el rock.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 4, fret: 1, finger: 1, role: 'third' },
          { string: 2, fret: 2, finger: 2, role: 'fifth' },
          { string: 3, fret: 2, finger: 3, role: 'root' },
        ],
      },
    ],
  },
  {
    id: 'chord-open-a-major',
    type: 'chord',
    name: 'A major (open)',
    category: 'open',
    description: { en: 'A bright open chord built on a simple three-finger shape across three strings.', vi: 'Một hợp âm mở tươi sáng dựa trên thế bấm ba ngón đơn giản trên ba dây.', ja: '3本の弦にまたがるシンプルな3本指の形で作る、明るいオープンコード。', zh: '一个明亮的开放和弦，指法简单，只需三根手指按在三根弦上。', es: 'Un acorde abierto brillante construido sobre una forma sencilla de tres dedos en tres cuerdas.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 3, fret: 2, finger: 1, role: 'fifth' },
          { string: 4, fret: 2, finger: 2, role: 'root' },
          { string: 5, fret: 2, finger: 3, role: 'third' },
        ],
        mutedStrings: [1],
      },
    ],
  },
  {
    id: 'chord-open-d-major',
    type: 'chord',
    name: 'D major (open)',
    category: 'open',
    description: { en: 'A compact triangular shape on the top three strings, root on the open D string.', vi: 'Một thế bấm hình tam giác gọn gàng trên ba dây cao nhất, âm chủ trên dây D buông.', ja: '上位3弦上のコンパクトな三角形の形で、ルートは開放D弦にある。', zh: '在最高三根弦上组成的紧凑三角形指型，根音在D空弦上。', es: 'Una forma triangular compacta en las tres cuerdas más agudas, con la fundamental en la cuerda D al aire.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 4, fret: 2, finger: 1, role: 'fifth' },
          { string: 6, fret: 2, finger: 2, role: 'third' },
          { string: 5, fret: 3, finger: 3, role: 'root' },
        ],
        mutedStrings: [1, 2],
      },
    ],
  },
  {
    id: 'chord-open-g-major',
    type: 'chord',
    name: 'G major (open)',
    category: 'open',
    description: { en: 'One of the five chords this app\'s Open Chord Changes exercise cycles through — root on both outer strings.', vi: 'Một trong năm hợp âm mà bài tập Chuyển đổi Hợp âm Mở của ứng dụng này luân phiên qua — âm chủ trên cả hai dây ngoài cùng.', ja: 'このアプリのオープンコードチェンジ練習で使われる5つのコードの1つ――両端の弦にルート音がある。', zh: '本应用「开放和弦转换」练习中循环的五个和弦之一——根音同时出现在最外侧两根弦上。', es: 'Uno de los cinco acordes que recorre el ejercicio de Cambios de Acordes Abiertos de esta app: fundamental en ambas cuerdas exteriores.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 1, fret: 3, finger: 2, role: 'root' },
          { string: 2, fret: 2, finger: 1, role: 'third' },
          { string: 6, fret: 3, finger: 3, role: 'root' },
        ],
      },
    ],
  },
  {
    id: 'chord-open-c-major',
    type: 'chord',
    name: 'C major',
    category: 'open',
    description: { en: 'A staple open chord — root on the A string, with a light stretch to the D string. Shown here in three voicings: the familiar open shape, a movable barre shape (A-shape, same fingering pattern anywhere on the neck), and a compact top-string alternative.', vi: 'Một hợp âm mở chủ lực — âm chủ trên dây A, kèm một khoảng giãn nhẹ tới dây D. Ở đây trình bày ba thế bấm: thế mở quen thuộc, một thế barre có thể di chuyển (A-shape, cùng cách bấm ngón ở bất kỳ đâu trên cần đàn), và một thế thay thế gọn trên các dây cao.', ja: '定番のオープンコード――ルートはA弦にあり、D弦への軽いストレッチが必要。ここではおなじみのオープンの形、movable(移動可能)なバレーの形(A-shape、ネック上どこでも同じ運指パターン)、そしてコンパクトな上位弦の代替形という3つのボイシングを紹介する。', zh: '一个常用的开放和弦——根音在A弦上，需要轻微伸展手指到D弦。这里展示三种指法：常见的开放指型、可移动的横按指型（A型，同一套指法可在指板任意位置使用），以及一种紧凑的高音弦替代指法。', es: 'Un acorde abierto básico: fundamental en la cuerda A, con un ligero estiramiento hacia la cuerda D. Aquí se muestra en tres digitaciones: la forma abierta habitual, una forma movible con cejilla (A-shape, el mismo patrón de digitación en cualquier parte del mástil) y una alternativa compacta en las cuerdas agudas.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 5, fret: 1, finger: 1, role: 'root' },
          { string: 3, fret: 2, finger: 2, role: 'third' },
          { string: 2, fret: 3, finger: 3, role: 'root' },
        ],
        mutedStrings: [1],
      },
      {
        id: 'barre',
        label: 'Barre',
        startFret: 3,
        fretCount: 3,
        positions: [
          { string: 2, fret: 3, role: 'root' },
          { string: 3, fret: 5, role: 'fifth' },
          { string: 4, fret: 5, role: 'root' },
          { string: 5, fret: 5, role: 'third' },
          { string: 6, fret: 3, role: 'fifth' },
        ],
        mutedStrings: [1],
        caption: { en: 'The open A-shape moved up and barred at fret 3 — a genuine stretch, so fingering is left open here since it varies by hand size.', vi: 'Thế A mở được đẩy lên và chặn (barre) ở phím 3 — đòi hỏi một độ giãn ngón tay thật sự, nên cách bấm ngón để mở ở đây vì nó thay đổi tùy theo kích thước bàn tay.', ja: 'オープンのA-shapeを上に移動させ、3フレットでバレーした形――実際にかなりのストレッチが必要なため、手の大きさによって運指が変わるので、ここでは運指をあえて指定していない。', zh: '把开放A型和弦上移并在第3品横按——这确实需要一定的手指跨度，因此这里不固定具体指法，因为它会因手型大小而异。', es: 'La forma A abierta desplazada hacia arriba y con cejilla en el traste 3: un estiramiento real, por lo que la digitación se deja abierta aquí, ya que varía según el tamaño de la mano.' },
      },
      {
        id: 'alternative',
        label: 'Alternative',
        startFret: 1,
        fretCount: 3,
        positions: [{ string: 5, fret: 1, finger: 1, role: 'root' }],
        mutedStrings: [1, 2, 3],
        caption: { en: 'A compact top-three-string voicing — just one fretted note (the G and e strings ring open), handy when you need C fast without the full shape.', vi: 'Thế bấm gọn trên ba dây cao nhất — chỉ một nốt bấm phím (dây G và e ngân buông), tiện lợi khi bạn cần hợp âm C nhanh mà không cần thế bấm đầy đủ.', ja: '上位3弦だけを使うコンパクトなボイシング――押さえる音はたった1つ(GとE弦は開放で鳴らす)。完全な形を使わずに素早くCを鳴らしたいときに便利。', zh: '在最高三根弦上的紧凑指型——只需按一个音（G弦和高音e弦保持空弦发声），在不需要完整指型时能快速弹出C和弦。', es: 'Una digitación compacta en las tres cuerdas más agudas: solo una nota pisada (las cuerdas G y e suenan al aire), útil cuando necesitas un C rápido sin la forma completa.' },
      },
    ],
  },
  {
    id: 'chord-open-e-minor',
    type: 'chord',
    name: 'E minor (open)',
    category: 'open',
    description: { en: 'Often the very first chord a beginner plays — just two fingers, full and dark-sounding.', vi: 'Thường là hợp âm đầu tiên mà người mới chơi — chỉ hai ngón, đầy đặn và có màu âm tối.', ja: '初心者が最初に弾くコードであることが多い――たった2本の指で、豊かでダークな響きを持つ。', zh: '通常是初学者弹的第一个和弦——只需两根手指，音色饱满而低沉。', es: 'A menudo el primerísimo acorde que toca un principiante: solo dos dedos, pleno y de sonido oscuro.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 2, fret: 2, finger: 2, role: 'fifth' },
          { string: 3, fret: 2, finger: 3, role: 'root' },
        ],
      },
    ],
  },
  {
    id: 'chord-open-a-minor',
    type: 'chord',
    name: 'A minor',
    category: 'open',
    description: { en: 'The relative minor of C major — swap freely between the two using mostly the same fingers. Shown here in three voicings: the familiar open shape, a movable barre shape (E-minor-shape, same fingering pattern anywhere on the neck), and a compact mid-neck alternative.', vi: 'Hợp âm thứ song song (relative minor) của C trưởng — chuyển đổi tự do giữa hai hợp âm này chủ yếu dùng cùng những ngón tay. Ở đây trình bày ba thế bấm: thế mở quen thuộc, một thế barre có thể di chuyển (E-minor-shape, cùng cách bấm ngón ở bất kỳ đâu trên cần đàn), và một thế thay thế gọn ở giữa cần đàn.', ja: 'C majorの平行調にあたるマイナーコード――ほぼ同じ指を使って2つを自由に行き来できる。ここではおなじみのオープンの形、movable(移動可能)なバレーの形(E-minor-shape、ネック上どこでも同じ運指パターン)、そしてコンパクトなミドルネックの代替形という3つのボイシングを紹介する。', zh: 'C大调的关系小调——两者之间可以用几乎相同的手指自由切换。这里展示三种指法：常见的开放指型、可移动的横按指型（E小调型，同一套指法可在指板任意位置使用），以及一种紧凑的中把位替代指法。', es: 'La relativa menor de C mayor: cambia libremente entre ambos usando en su mayoría los mismos dedos. Aquí se muestra en tres digitaciones: la forma abierta habitual, una forma movible con cejilla (E-minor-shape, el mismo patrón de digitación en cualquier parte del mástil) y una alternativa compacta a mitad de mástil.' },
    shapes: [
      {
        id: 'open',
        label: 'Open',
        startFret: 1,
        fretCount: 3,
        positions: [
          { string: 5, fret: 1, finger: 1, role: 'third' },
          { string: 3, fret: 2, finger: 2, role: 'fifth' },
          { string: 4, fret: 2, finger: 3, role: 'root' },
        ],
        mutedStrings: [1],
      },
      {
        id: 'barre',
        label: 'Barre',
        startFret: 5,
        fretCount: 3,
        positions: [
          { string: 1, fret: 5, finger: 1, role: 'root' },
          { string: 2, fret: 7, finger: 3, role: 'fifth' },
          { string: 3, fret: 7, finger: 4, role: 'root' },
          { string: 4, fret: 5, finger: 1, role: 'third' },
          { string: 5, fret: 5, finger: 1, role: 'fifth' },
          { string: 6, fret: 5, finger: 1, role: 'root' },
        ],
        caption: { en: 'The open E-minor shape moved up and barred at fret 5 with finger 1 — the ring and pinky fingers add the notes on the D and A strings.', vi: 'Thế E thứ mở được đẩy lên và chặn (barre) ở phím 5 bằng ngón 1 — ngón áp út và ngón út thêm các nốt trên dây D và A.', ja: 'オープンのE-minorの形を上に移動させ、人差し指(1指)で5フレットをバレーした形――薬指と小指がD弦とA弦の音を加える。', zh: '把开放E小调指型上移，用食指在第5品横按——无名指和小指负责按D弦和A弦上的音。', es: 'La forma de E menor abierta desplazada hacia arriba y con cejilla en el traste 5 con el dedo 1: los dedos anular y meñique añaden las notas en las cuerdas D y A.' },
      },
      {
        id: 'alternative',
        label: 'Alternative',
        startFret: 5,
        fretCount: 3,
        positions: [
          { string: 3, fret: 7, finger: 4, role: 'root' },
          { string: 4, fret: 5, finger: 1, role: 'third' },
          { string: 5, fret: 5, finger: 2, role: 'fifth' },
        ],
        mutedStrings: [1, 2, 6],
        caption: { en: 'A compact mid-neck triad on the D, G and B strings — no barre needed.', vi: 'Một triad gọn ở giữa cần đàn trên các dây D, G và B — không cần barre.', ja: 'D、G、B弦上のコンパクトなミドルネックのトライアド――バレーは不要。', zh: '在D、G、B弦上组成的紧凑中把位三和弦——不需要横按。', es: 'Una tríada compacta a mitad de mástil en las cuerdas D, G y B: no se necesita cejilla.' },
      },
    ],
  },
]

const CAGED_MAJOR_G: ChordConcept = {
  id: 'chord-caged-major-g',
  type: 'chord',
  name: 'CAGED Major Chord Shapes',
  category: 'barre',
  aliases: ['CAGED system', 'CAGED shapes'],
  description: { en: 'The same major chord (shown here as G) fretted five different ways up the neck — the C, A, G, E and D open-chord shapes, four of them moved up and barred. This is what "the complete set of shapes for a concept" means: one chord, everywhere on the neck.', vi: 'Cùng một hợp âm trưởng (ở đây minh họa là G) được bấm theo năm cách khác nhau dọc cần đàn — các thế hợp âm mở C, A, G, E và D, trong đó bốn thế được đẩy lên và chặn (barre). Đây chính là ý nghĩa của "bộ đầy đủ các thế cho một khái niệm": một hợp âm, ở khắp mọi nơi trên cần đàn.', ja: '同じメジャーコード(ここではGとして表示)を、ネック上で5通りの異なる押さえ方で弾く――C、A、G、E、Dのオープンコードの形で、そのうち4つは上に移動させてバレーしたもの。これが『あるコンセプトの完全な形のセット』という意味――1つのコードが、ネック上のあらゆる場所にある。', zh: '同一个大三和弦（这里以G为例）在指板上以五种不同方式按出——分别对应C、A、G、E、D这五个开放和弦指型，其中四个被上移并横按。这正是「一个概念的完整指型集合」的含义：同一个和弦，遍布整条指板。', es: 'El mismo acorde mayor (mostrado aquí como G) pisado de cinco formas distintas por el mástil: las formas de acordes abiertos C, A, G, E y D, cuatro de ellas desplazadas hacia arriba y con cejilla. Esto es lo que significa "el conjunto completo de formas para un concepto": un acorde, en cualquier parte del mástil.' },
  shapes: [
    {
      id: 'shape-g',
      label: 'G-shape',
      startFret: 1,
      fretCount: 3,
      positions: [
        { string: 1, fret: 3, finger: 2, role: 'root' },
        { string: 2, fret: 2, finger: 1, role: 'third' },
        { string: 6, fret: 3, finger: 3, role: 'root' },
      ],
      caption: { en: 'This is just the open G chord — the starting point CAGED cycles out from.', vi: 'Đây chỉ đơn giản là hợp âm G mở — điểm khởi đầu mà CAGED xoay vòng ra từ đó.', ja: 'これは単純なオープンGコード――CAGEDがここから循環を始める出発点。', zh: '这就是开放G和弦本身——CAGED循环的起点。', es: 'Este es simplemente el acorde G abierto: el punto de partida desde el que se despliega el sistema CAGED.' },
    },
    {
      id: 'shape-e',
      label: 'E-shape',
      startFret: 3,
      fretCount: 3,
      positions: [
        { string: 1, fret: 3, finger: 1, role: 'root' },
        { string: 5, fret: 3, finger: 1, role: 'fifth' },
        { string: 6, fret: 3, finger: 1, role: 'root' },
        { string: 4, fret: 4, finger: 2, role: 'third' },
        { string: 2, fret: 5, finger: 3, role: 'fifth' },
        { string: 3, fret: 5, finger: 4, role: 'root' },
      ],
      caption: { en: 'The open E shape, barred at fret 3 — the classic first barre chord most players learn.', vi: 'Thế E mở, được chặn (barre) ở phím 3 — hợp âm barre đầu tiên kinh điển mà hầu hết người chơi học.', ja: 'オープンEの形を3フレットでバレーしたもの――ほとんどの人が最初に覚える定番のバレーコード。', zh: '开放E型指型，在第3品横按——大多数吉他手最早学会的经典横按和弦。', es: 'La forma E abierta, con cejilla en el traste 3: el clásico primer acorde con cejilla que aprende la mayoría de los guitarristas.' },
    },
    {
      id: 'shape-d',
      label: 'D-shape',
      startFret: 5,
      fretCount: 4,
      positions: [
        { string: 3, fret: 5, role: 'root' },
        { string: 4, fret: 7, role: 'fifth' },
        { string: 5, fret: 8, role: 'root' },
        { string: 6, fret: 7, role: 'third' },
      ],
      mutedStrings: [1, 2],
      caption: { en: 'The open D shape moved up. Low E and A strings are skipped entirely — a genuine barre and stretch, so fingering is left open here since it varies by hand size.', vi: 'Thế D mở được đẩy lên. Dây E trầm và dây A hoàn toàn không được chơi tới — một thế barre và độ giãn ngón thực sự, nên cách bấm ngón để mở ở đây vì nó thay đổi tùy theo kích thước bàn tay.', ja: 'オープンDの形を上に移動させたもの。低いEとA弦はまったく使わない――実際にバレーとストレッチが必要なため、手の大きさによって運指が変わるので、ここでは運指をあえて指定していない。', zh: '开放D型指型上移。完全跳过低音E弦和A弦——这确实需要横按和一定的手指跨度，因此这里不固定具体指法，因为它会因手型大小而异。', es: 'La forma D abierta desplazada hacia arriba. Las cuerdas E grave y A se omiten por completo: una cejilla y un estiramiento reales, por lo que la digitación se deja abierta aquí, ya que varía según el tamaño de la mano.' },
    },
    {
      id: 'shape-c',
      label: 'C-shape',
      startFret: 7,
      fretCount: 4,
      positions: [
        { string: 2, fret: 10, role: 'root' },
        { string: 3, fret: 9, role: 'third' },
        { string: 4, fret: 7, role: 'fifth' },
        { string: 5, fret: 8, role: 'root' },
        { string: 6, fret: 7, role: 'third' },
      ],
      mutedStrings: [1],
      caption: { en: 'The open C shape moved up — low E string skipped. Fingering varies by hand; often a partial barre.', vi: 'Thế C mở được đẩy lên — bỏ qua dây E trầm. Cách bấm ngón thay đổi tùy bàn tay; thường là một barre một phần.', ja: 'オープンCの形を上に移動させたもの――低いE弦は使わない。運指は手によって異なり、しばしば部分的なバレーになる。', zh: '开放C型指型上移——跳过低音E弦。指法因人而异，通常需要部分横按。', es: 'La forma C abierta desplazada hacia arriba, omitiendo la cuerda E grave. La digitación varía según la mano; a menudo es una cejilla parcial.' },
    },
    {
      id: 'shape-a',
      label: 'A-shape',
      startFret: 10,
      fretCount: 3,
      positions: [
        { string: 2, fret: 10, role: 'root' },
        { string: 3, fret: 12, role: 'fifth' },
        { string: 4, fret: 12, role: 'root' },
        { string: 5, fret: 12, role: 'third' },
        { string: 6, fret: 10, role: 'fifth' },
      ],
      mutedStrings: [1],
      caption: { en: 'The open A shape moved up, near the octave — the last of the five before the pattern repeats.', vi: 'Thế A mở được đẩy lên, gần đến quãng 8 — thế cuối cùng trong năm thế trước khi mẫu này lặp lại.', ja: 'オープンAの形を、オクターブ近くまで上に移動させたもの――パターンが繰り返す前の5つ目、最後の形。', zh: '开放A型指型上移，接近八度处——这是五个指型中的最后一个，之后整个模式会重新循环。', es: 'La forma A abierta desplazada hacia arriba, cerca de la octava: la última de las cinco antes de que el patrón se repita.' },
    },
  ],
}

export const CHORD_CONCEPTS: ChordConcept[] = [...OPEN_CHORDS, CAGED_MAJOR_G]

export function getChordConcept(id: string): ChordConcept | undefined {
  return CHORD_CONCEPTS.find((c) => c.id === id)
}
