#!/usr/bin/env python3
"""Create compact, on-demand GLB derivatives of official NASA STL terrains.

Requires trimesh and fast-simplification. Source STLs are downloaded to a
temporary directory and are not copied into the production bundle. Their
official download URLs, processing notes, and original SHA-256 values are
written to docs/terrain/manifest.json.
"""

from __future__ import annotations

import hashlib
import json
import tempfile
import urllib.request
from pathlib import Path

import trimesh

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/models/terrain"
MANIFEST = ROOT / "docs/terrain/manifest.json"

SITES = [
    {
        "id": "spirit-gusev",
        "body": "mars",
        "source_page": "https://science.nasa.gov/3d-resources/mars-spirit-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/mars---spirit-landing-site/Mars%20-%20Spirit%20Landing%20Site.stl?emrc=6ad11b4ad08a3",
        "file": "Mars - Spirit Landing Site.stl",
        "faces": 42000,
        "vertical_note": "NASA describes the height map as exaggerated in Z; no numeric factor is stated on the source page.",
    },
    {
        "id": "opportunity-meridiani",
        "body": "mars",
        "source_page": "https://science.nasa.gov/3d-resources/opportunity-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/opportunity-landing-site/Opportunity%20Landing%20Site.stl?emrc=6aa266dbb3d38",
        "file": "Opportunity Landing Site.stl",
        "faces": 24000,
        "vertical_note": "NASA describes the height map as exaggerated in Z; no numeric factor is stated on the source page.",
    },
    {
        "id": "curiosity-gale",
        "body": "mars",
        "source_page": "https://science.nasa.gov/3d-resources/curiosity-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/curiosity-landing-site/Curiosity%20Landing%20Site.stl?emrc=6adc82d275f8e",
        "file": "Curiosity Landing Site.stl",
        "faces": 24000,
        "vertical_note": "No vertical-exaggeration factor is stated on the source page; the displayed mesh is labeled a NASA landing-site height-map resource.",
    },
    {
        "id": "apollo-15-hadley-apennine",
        "body": "moon",
        "source_page": "https://science.nasa.gov/3d-resources/apollo-15-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/apollo-15---landing-site/Apollo%2015%20-%20Landing%20Site.stl?emrc=6adc82d1dcae0",
        "file": "Apollo 15 - Landing Site.stl",
        "faces": 28000,
        "vertical_note": "NASA states the Z axis is exaggerated 25×.",
    },
    {
        "id": "apollo-16-descartes",
        "body": "moon",
        "source_page": "https://science.nasa.gov/3d-resources/apollo-16-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/apollo-16---landing-site/Apollo%2016%20-%20Landing%20Site.stl?emrc=6a7a83a1e03d3",
        "file": "Apollo 16 - Landing Site.stl",
        "faces": 28000,
        "vertical_note": "NASA states the Z axis is exaggerated 35×.",
    },
    {
        "id": "apollo-17-taurus-littrow",
        "body": "moon",
        "source_page": "https://science.nasa.gov/3d-resources/apollo-17-landing-site/",
        "url": "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/apollo-17---landing-site/Apollo%2017%20-%20Landing%20Site.stl?emrc=6a7ce9220ab1f",
        "file": "Apollo 17 - Landing Site.stl",
        "faces": 42000,
        "vertical_note": "NASA states the Z axis is exaggerated 30×.",
    },
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    records = []
    with tempfile.TemporaryDirectory(prefix="afterlight-terrain-") as temp:
        temp_dir = Path(temp)
        for item in SITES:
            source = temp_dir / f"{item['id']}.stl"
            request = urllib.request.Request(
                item["url"], headers={"User-Agent": "AFTERLIGHT educational project"}
            )
            with urllib.request.urlopen(request, timeout=120) as response:
                source.write_bytes(response.read())
            if source.stat().st_size < 1024 or source.read_bytes()[:5].lower() == b"<html":
                raise RuntimeError(f"Invalid STL download for {item['id']}")

            mesh = trimesh.load(source, force="mesh", process=True)
            if not isinstance(mesh, trimesh.Trimesh) or len(mesh.faces) < 1000:
                raise RuntimeError(f"Unexpected terrain geometry for {item['id']}")
            original_faces = len(mesh.faces)
            if original_faces > item["faces"]:
                mesh = mesh.simplify_quadric_decimation(face_count=item["faces"])
            mesh.remove_unreferenced_vertices()
            mesh.visual.material = trimesh.visual.material.PBRMaterial(
                baseColorFactor=[151, 165, 172, 255],
                metallicFactor=0.02,
                roughnessFactor=0.9,
            )
            destination = OUTPUT / item["body"] / f"{item['id']}.glb"
            destination.parent.mkdir(parents=True, exist_ok=True)
            mesh.export(destination, file_type="glb")
            records.append(
                {
                    "id": item["id"],
                    "body": item["body"],
                    "source_page": item["source_page"],
                    "source_download": item["url"],
                    "source_sha256": sha256(source),
                    "source_bytes": source.stat().st_size,
                    "source_triangles": original_faces,
                    "prepared_triangles": len(mesh.faces),
                    "prepared_file": str(destination.relative_to(ROOT)),
                    "prepared_bytes": destination.stat().st_size,
                    "processing": "Triangle-count reduction only; no re-projection, vertical rescaling, or terrain reconstruction.",
                    "vertical_note": item["vertical_note"],
                }
            )
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(records)} terrain models: {MANIFEST}")
    for record in records:
        print(
            f"{record['id']}: {record['source_triangles']:,} → "
            f"{record['prepared_triangles']:,} faces; "
            f"{record['prepared_bytes'] / 1024 / 1024:.2f} MiB"
        )


if __name__ == "__main__":
    main()