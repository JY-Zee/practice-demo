"""
RAG 知识库系统 - Qdrant 集合初始化脚本
独立运行: python scripts/init_qdrant.py
"""

import os
import sys
import httpx


def get_config():
    return {
        "host": os.getenv("QDRANT_HOST", "localhost"),
        "port": int(os.getenv("QDRANT_HTTP_PORT", "6333")),
        "collection": os.getenv("QDRANT_COLLECTION", "kb_documents"),
        "dimension": int(os.getenv("EMBEDDING_DIMENSION", "1536")),
    }


def init_collection():
    config = get_config()
    base_url = f"http://{config['host']}:{config['port']}"
    collection = config["collection"]
    dimension = config["dimension"]

    print(f"连接 Qdrant: {base_url}")
    print(f"目标集合: {collection}, 向量维度: {dimension}")

    collection_exists = False

    try:
        resp = httpx.get(f"{base_url}/collections/{collection}", timeout=10)
        if resp.status_code == 200:
            collection_exists = True
            collection_info = resp.json().get("result", {})
            vectors = (
                collection_info.get("config", {})
                .get("params", {})
                .get("vectors")
            )

            if isinstance(vectors, dict) and isinstance(vectors.get("size"), int):
                current_dimension = vectors["size"]
                if current_dimension != dimension:
                    print(
                        f"集合 '{collection}' 已存在，但维度不匹配："
                        f"当前集合维度={current_dimension}，"
                        f"EMBEDDING_DIMENSION={dimension}"
                    )
                    sys.exit(1)
                print(f"集合 '{collection}' 已存在，维度校验通过")
            else:
                print(
                    f"集合 '{collection}' 已存在，但 vectors 配置不是当前脚本支持的匿名单向量格式：{vectors}"
                )
                sys.exit(1)
    except httpx.ConnectError:
        print(f"无法连接 Qdrant ({base_url})，请确认服务已启动")
        sys.exit(1)

    if not collection_exists:
        payload = {
            "vectors": {
                "size": dimension,
                "distance": "Cosine",
            }
        }

        resp = httpx.put(
            f"{base_url}/collections/{collection}",
            json=payload,
            timeout=30,
        )

        if resp.status_code == 200:
            print(f"集合 '{collection}' 创建成功")
        else:
            print(f"创建集合失败: {resp.status_code} - {resp.text}")
            sys.exit(1)

    index_payload = {
        "field_name": "document_id",
        "field_schema": "keyword",
    }
    resp = httpx.put(
        f"{base_url}/collections/{collection}/index",
        json=index_payload,
        timeout=30,
    )
    if resp.status_code == 200:
        print("已创建 document_id payload 索引")

    index_payload["field_name"] = "file_name"
    resp = httpx.put(
        f"{base_url}/collections/{collection}/index",
        json=index_payload,
        timeout=30,
    )
    if resp.status_code == 200:
        print("已创建 file_name payload 索引")

    index_payload["field_name"] = "chunk_id"
    resp = httpx.put(
        f"{base_url}/collections/{collection}/index",
        json=index_payload,
        timeout=30,
    )
    if resp.status_code == 200:
        print("已创建 chunk_id payload 索引")

    print("Qdrant 初始化完成")


if __name__ == "__main__":
    init_collection()
