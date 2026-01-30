#!/bin/bash

# 数据库备份脚本
set -e

# 配置变量
BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="blog_backup_$DATE.sql.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 数据库备份函数
backup_database() {
    echo "开始备份数据库..."
    
    # Supabase备份（如果配置了直接访问）
    if [ -n "$SUPABASE_DB_URL" ]; then
        pg_dump "$SUPABASE_DB_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"
    else
        # 通过Supabase API备份（需要自定义实现）
        echo "使用Supabase API进行备份..."
        # 这里可以调用自定义的备份API
    fi
    
    echo "数据库备份完成: $BACKUP_DIR/$BACKUP_FILE"
}

# 文件备份函数
backup_files() {
    echo "开始备份文件..."
    
    # 备份重要配置文件
    tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
        package.json \
        next.config.ts \
        tsconfig.json \
        .env* \
        --exclude=.env.local
    
    # 备份日志文件
    if [ -d "logs" ]; then
        tar -czf "$BACKUP_DIR/logs_backup_$DATE.tar.gz" logs/
    fi
    
    echo "文件备份完成"
}

# 清理旧备份
cleanup_old_backups() {
    echo "清理7天前的旧备份..."
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
}

# 验证备份
verify_backup() {
    echo "验证备份完整性..."
    
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        gunzip -t "$BACKUP_DIR/$BACKUP_FILE"
        echo "备份文件验证通过"
    else
        echo "备份文件不存在"
        exit 1
    fi
}

# 上传到云存储（可选）
upload_to_cloud() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$S3_BACKUP_BUCKET" ]; then
        echo "上传备份到S3..."
        aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BACKUP_BUCKET/backups/"
    fi
}

# 主执行流程
main() {
    echo "=== 博客系统备份开始 $(date) ==="
    
    backup_database
    backup_files
    cleanup_old_backups
    verify_backup
    upload_to_cloud
    
    echo "=== 备份完成 $(date) ==="
    
    # 发送通知（如果配置了webhook）
    if [ -n "$BACKUP_NOTIFICATION_URL" ]; then
        curl -X POST "$BACKUP_NOTIFICATION_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"success\",\"timestamp\":\"$(date -Iseconds)\",\"backup_file\":\"$BACKUP_FILE\"}"
    fi
}

# 错误处理
trap 'echo "备份失败: $?"' ERR

# 执行主函数
main