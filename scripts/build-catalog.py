"""Builds the exercise catalog used by Gafit from the ExerciseDB V1 snapshot.

Inputs:  scripts/source/exercisedb-v1.json (fetched from oss.exercisedb.dev)
         scripts/source/names-pt.tsv        (English name -> Brazilian gym name)
Outputs: src/data/exercises.json  (full records, server side)
         public/catalog.json      (compact index for search on the client)
"""
import json, re, unicodedata, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = json.load(open(ROOT / "scripts/source/exercisedb-v1.json"))
pt = {}
for line in open(ROOT / "scripts/source/names-pt.tsv", encoding="utf-8"):
    line = line.rstrip("\n")
    if line:
        en, p = line.split("\t")
        pt[en.strip().lower()] = p.strip()

GROUP = {  # target muscle -> app muscle group
    "abdominals": "abdomen", "pectorals": "peito", "glutes": "gluteos", "biceps": "biceps",
    "triceps": "triceps", "deltoids": "ombros", "upper back": "costas", "latissimus dorsi": "costas",
    "calves": "panturrilha", "quadriceps": "quadriceps", "forearms": "antebraco",
    "cardiovascular system": "cardio", "hamstrings": "posterior", "erector spinae": "lombar",
    "trapezius": "trapezio", "abductors": "gluteos", "serratus anterior": "peito",
    "adductors": "adutores", "levator scapulae": "trapezio",
}
SECONDARY_GROUP = {
    "deltoids": "ombros", "rear deltoids": "ombros", "rotator cuff": "ombros", "hamstrings": "posterior",
    "forearms": "antebraco", "wrists": "antebraco", "wrist flexors": "antebraco", "wrist extensors": "antebraco",
    "grip muscles": "antebraco", "hands": "antebraco", "triceps": "triceps", "biceps": "biceps",
    "brachialis": "biceps", "quadriceps": "quadriceps", "calves": "panturrilha", "soleus": "panturrilha",
    "glutes": "gluteos", "core": "abdomen", "obliques": "abdomen", "abdominals": "abdomen",
    "pectorals": "peito", "trapezius": "trapezio", "erector spinae": "lombar", "rhomboids": "costas",
    "upper back": "costas", "back": "costas", "latissimus dorsi": "costas", "adductors": "adutores",
}
EQUIP = {
    "bodyweight": "Peso corporal", "dumbbell": "Halteres", "cable": "Polia", "barbell": "Barra",
    "stability ball": "Bola suíça", "leverage machine": "Máquina", "resistance band": "Elástico",
    "smith machine": "Smith", "kettlebell": "Kettlebell", "weighted": "Anilha / peso", "EZ bar": "Barra W",
    "assisted": "Assistido", "sled machine": "Leg press / hack", "medicine ball": "Medicine ball",
    "rope": "Corda", "roller": "Rolo", "suspension trainer": "TRX", "bosu ball": "Bosu",
    "elliptical machine": "Elíptico", "towel": "Toalha", "ab wheel": "Rolinho", "olympic barbell": "Barra olímpica",
    "tennis ball": "Bola de tênis", "stationary bike": "Bicicleta", "stepmill machine": "Escada",
    "trap bar": "Trap bar", "tire": "Pneu", "upper body ergometer": "Ergômetro de braço",
    "hammer": "Marreta", "ski ergometer": "Ergômetro de esqui",
}
EQUIP_KEY = {  # equipment -> filter bucket
    "bodyweight": "corporal", "dumbbell": "halteres", "cable": "polia", "barbell": "barra",
    "olympic barbell": "barra", "EZ bar": "barra", "trap bar": "barra", "leverage machine": "maquina",
    "sled machine": "maquina", "smith machine": "maquina", "assisted": "maquina", "kettlebell": "outros",
    "resistance band": "elastico", "suspension trainer": "outros",
}
MUSCLE_PT = {
    "abdominals": "Abdômen", "pectorals": "Peitoral", "glutes": "Glúteos", "biceps": "Bíceps",
    "triceps": "Tríceps", "deltoids": "Deltoides", "upper back": "Costas superiores",
    "latissimus dorsi": "Dorsal", "calves": "Panturrilhas", "quadriceps": "Quadríceps",
    "forearms": "Antebraços", "cardiovascular system": "Cardio", "hamstrings": "Posteriores de coxa",
    "erector spinae": "Lombar", "trapezius": "Trapézio", "abductors": "Abdutores",
    "serratus anterior": "Serrátil anterior", "adductors": "Adutores", "levator scapulae": "Elevador da escápula",
    "rear deltoids": "Deltoide posterior", "rotator cuff": "Manguito rotador", "core": "Core",
    "obliques": "Oblíquos", "hip flexors": "Flexores do quadril", "rhomboids": "Romboides",
    "brachialis": "Braquial", "ankles": "Tornozelos", "back": "Costas", "feet": "Pés", "soleus": "Sóleo",
    "ankle stabilizers": "Estabilizadores do tornozelo", "wrists": "Punhos", "hands": "Mãos",
    "wrist flexors": "Flexores do punho", "wrist extensors": "Extensores do punho",
    "sternocleidomastoid": "Esternocleidomastoideo", "grip muscles": "Pegada", "tibialis anterior": "Tibial anterior",
}

def fold(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")

full, compact, seen = [], [], set()
for x in src:
    key = x["name"].strip().lower()
    if key in seen:
        continue
    seen.add(key)
    target = x["targetMuscles"][0] if x["targetMuscles"] else ""
    group = GROUP.get(target, "outros")
    secondary = sorted({SECONDARY_GROUP[m] for m in x["secondaryMuscles"] if m in SECONDARY_GROUP} - {group})
    equipment = x["equipments"][0] if x["equipments"] else "bodyweight"
    steps = [re.sub(r"^Step:\s*\d+\s*", "", s).strip() for s in x["instructions"]]
    rec = {
        "id": x["exerciseId"],
        "name": pt[key],
        "nameEn": x["name"].strip(),
        "gif": x["gifUrl"],
        "group": group,
        "secondaryGroups": secondary,
        "target": MUSCLE_PT.get(target, target),
        "secondaryMuscles": [MUSCLE_PT.get(m, m) for m in x["secondaryMuscles"]],
        "equipment": EQUIP.get(equipment, equipment),
        "equipmentKey": EQUIP_KEY.get(equipment, "outros"),
        "isCardio": group == "cardio",
        "instructionsEn": steps,
    }
    full.append(rec)
    compact.append([rec["id"], rec["name"], rec["nameEn"], rec["group"], rec["equipmentKey"],
                    rec["equipment"], rec["target"], ",".join(secondary)])

# Some ExerciseDB entries are the same movement filmed twice; they share one Portuguese name.
# Keep every id resolvable (old plans may reference it) but list only one per name.
import re as _re
pinned = set(_re.findall(r'"([A-Za-z0-9]{7})"', open(ROOT / "src/lib/templates.ts").read()))
by_name = {}
for r in full:
    by_name.setdefault(r["name"], []).append(r)
hidden = set()
for name, group in by_name.items():
    if len(group) > 1:
        keep = next((r for r in group if r["id"] in pinned), group[0])
        hidden.update(r["id"] for r in group if r is not keep)
for r in full:
    r["hidden"] = r["id"] in hidden
compact = [c for c in compact if c[0] not in hidden]

full.sort(key=lambda r: fold(r["name"]))
compact.sort(key=lambda r: fold(r[1]))
json.dump(full, open(ROOT / "src/data/exercises.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({"v": 1, "fields": ["id", "name", "nameEn", "group", "equipmentKey", "equipment", "target", "secondary"],
           "rows": compact}, open(ROOT / "public/catalog.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(full), "exercises,", len(compact), "listed")
