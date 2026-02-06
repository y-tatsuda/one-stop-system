'use client'

/**
 * =====================================================
 * ECサイト - ブログ一覧ページ
 * =====================================================
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { DEFAULT_TENANT_ID } from '../../lib/constants'
import '../shop.css'

type BlogPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  category: string
  published_at: string
  thumbnail_url: string | null
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('t_blog_posts')
        .select('id, slug, title, excerpt, category, published_at, thumbnail_url')
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (error) {
        console.log('ブログテーブルが未作成です')
        setPosts([])
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error('ブログ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  // サンプル記事（DBにデータがない場合）
  const samplePosts: BlogPost[] = [
    {
      id: 1,
      slug: 'how-to-choose-iphone',
      title: '【2025年版】中古iPhoneの選び方完全ガイド',
      excerpt: 'モデル、ストレージ、状態の見方など、中古iPhoneを選ぶときのポイントを詳しく解説します。',
      category: '選び方',
      published_at: '2025-01-15',
      thumbnail_url: null,
    },
    {
      id: 2,
      slug: 'battery-health-guide',
      title: 'バッテリー最大容量とは？何%あれば大丈夫？',
      excerpt: 'iPhoneのバッテリー最大容量の意味と、中古購入時の目安について解説します。',
      category: '豆知識',
      published_at: '2025-01-10',
      thumbnail_url: null,
    },
    {
      id: 3,
      slug: 'nw-restriction-explained',
      title: 'ネットワーク利用制限○△×の違いとは？',
      excerpt: '中古スマホでよく見る「ネットワーク利用制限」について分かりやすく解説します。',
      category: '豆知識',
      published_at: '2025-01-05',
      thumbnail_url: null,
    },
  ]

  const displayPosts = posts.length > 0 ? posts : samplePosts

  return (
    <div className="content-page" style={{ maxWidth: '1000px' }}>
      <h1>ブログ</h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
        iPhoneの選び方や豆知識、お得な情報を発信しています
      </p>

      {loading ? (
        <div className="shop-loading">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="blog-grid">
          {displayPosts.map(post => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-image">
                {post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt={post.title} />
                ) : (
                  <div className="blog-card-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              <div className="blog-card-body">
                <span className="blog-card-category">{post.category}</span>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <div className="blog-card-meta">
                  <span className="blog-card-date">{formatDate(post.published_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-info-light)', borderRadius: 'var(--radius)' }}>
          <p style={{ margin: 0, color: 'var(--color-info)' }}>
            ブログ記事は準備中です。近日公開予定！
          </p>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
        <Link href="/shop" className="btn btn-secondary">
          商品一覧に戻る
        </Link>
      </div>
    </div>
  )
}
