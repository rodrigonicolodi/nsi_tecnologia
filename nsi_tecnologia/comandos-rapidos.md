# 🚀 Comandos Rápidos para Produção

## 📋 **Comando Principal (Use sempre após upload):**

```bash
pm2 restart nsi-tecnologia && pm2 logs nsi-tecnologia --lines 5
```

## 🔧 **Comandos Individuais:**

### **Reiniciar apenas:**
```bash
pm2 restart nsi-tecnologia
```

### **Ver status:**
```bash
pm2 status
```

### **Ver logs:**
```bash
pm2 logs nsi-tecnologia --lines 10
```

### **Parar tudo:**
```bash
pm2 stop all
```

### **Iniciar tudo:**
```bash
pm2 start app.js --name nsi-tecnologia
```

### **Ver logs em tempo real:**
```bash
pm2 logs nsi-tecnologia --follow
```

## ⚡ **Comando Completo (recomendado):**

```bash
pm2 restart nsi-tecnologia && sleep 3 && pm2 status && pm2 logs nsi-tecnologia --lines 5
```

## 🧪 **Testar se está funcionando:**

```bash
curl http://localhost:61910/api/dashboard/stats
```

---
**Use sempre o primeiro comando após enviar arquivos!** 🎯
