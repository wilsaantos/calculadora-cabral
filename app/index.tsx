import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const DOSES = [
  { label: "Equipe Terrestre", value: 0.35, sub: "0.35 g/L" },
  { label: "Avião", value: 0.60, sub: "0.60 g/L" },
  { label: "Custom", value: null, sub: "personalizado" },
];

function fmtKg(kg: number): string {
  const s = parseFloat(kg.toPrecision(10)).toString();
  return s;
}

function fmtNum(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Resultado = {
  dose: number; litros: number;
  precoRaw: number; precoUnit: "kg" | "g";
  precoG: number; qtdG: number; qtdKg: number; total: number;
};

export default function Index() {
  const [doseIdx, setDoseIdx]       = useState(0);
  const [customDose, setCustomDose] = useState("");
  const [precoUnit, setPrecoUnit]   = useState<"kg" | "g">("kg");
  const [preco, setPreco]           = useState("");
  const [litros, setLitros]         = useState("");
  const [resultado, setResultado]   = useState<Resultado | null>(null);

  function calcular() {
    let dose: number;
    if (DOSES[doseIdx].value !== null) {
      dose = DOSES[doseIdx].value!;
    } else {
      dose = parseFloat(customDose.replace(",", "."));
      if (!dose || dose <= 0) {
        Alert.alert("Erro", "Insira uma dose personalizada válida.");
        return;
      }
    }

    const precoRaw = parseFloat(preco.replace(",", "."));
    const litrosN  = parseFloat(litros.replace(",", "."));

    if (!precoRaw || precoRaw <= 0 || !litrosN || litrosN <= 0) {
      Alert.alert("Erro", "Insira valores numéricos válidos e maiores que zero.");
      return;
    }

    const precoG = precoUnit === "kg" ? precoRaw / 1000 : precoRaw;
    const qtdG   = litrosN * dose;
    const qtdKg  = qtdG / 1000;
    const total  = precoG * qtdG;

    setResultado({ dose, litros: litrosN, precoRaw, precoUnit, precoG, qtdG, qtdKg, total });
  }

  async function exportarPdf() {
    if (!resultado) {
      Alert.alert("Atenção", "Realize o cálculo antes de exportar.");
      return;
    }
    const r = resultado;
    const now = new Date().toLocaleString("pt-BR");
    const html = `
      <html><head><meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; background: #fff; }
        h1 { color: #c0390a; text-align: center; margin-bottom: 4px; }
        h3 { color: #ff6a00; text-align: center; margin-top: 0; }
        .date { color: #888; font-size: 13px; margin-bottom: 24px; }
        hr { border: 1px solid #ff6a00; margin: 16px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #c0390a; color: #fff; padding: 10px; font-size: 14px; }
        td { padding: 10px; font-size: 13px; text-align: center; border: 1px solid #f0c0a0; }
        tr:nth-child(even) td { background: #fff0e6; }
        .total { color: #c0390a; font-size: 20px; font-weight: bold; text-align: center; margin-top: 24px; }
      </style></head><body>
      <h1>🔥 Recibo de Cálculo</h1>
      <h3>Calculadora Cabral</h3>
      <p class="date">Data: ${now}</p>
      <hr/>
      <table>
        <tr><th>Campo</th><th>Valor</th></tr>
        <tr><td>Preço inserido</td><td>R$ ${fmtNum(r.precoRaw)} (R$/${r.precoUnit})</td></tr>
        <tr><td>Preço por grama</td><td>R$ ${r.precoG.toFixed(6)}</td></tr>
        <tr><td>Tamanho do tanque</td><td>${fmtNum(r.litros)} L</td></tr>
        <tr><td>Dose aplicada</td><td>${r.dose} g/L</td></tr>
        <tr><td>Quantidade de produto</td><td>${fmtNum(r.qtdG)}g (${fmtKg(r.qtdKg)}kg)</td></tr>
        <tr><td>Cálculo</td><td>R$ ${r.precoG.toFixed(6)} × ${fmtNum(r.qtdG)}g</td></tr>
      </table>
      <hr/>
      <p class="total">TOTAL: R$ ${fmtNum(r.total)}</p>
      </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Salvar recibo" });
  }

  return (
    <LinearGradient colors={["#1a0800", "#2d0f00", "#1a0800"]} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.subtitle}>Calculadora</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Dose */}
            <Text style={styles.label}>Tipo de Aplicação / Dose</Text>
            <View style={styles.doseRow}>
              {DOSES.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.doseBtn, doseIdx === i && styles.doseBtnActive]}
                  onPress={() => setDoseIdx(i)}
                >
                  <Text style={[styles.doseBtnText, doseIdx === i && styles.doseBtnTextActive]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.doseBtnSub, doseIdx === i && styles.doseBtnSubActive]}>
                    {d.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {doseIdx === 2 && (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="ex: 0.50"
                  placeholderTextColor="#7a3a1a"
                  keyboardType="decimal-pad"
                  value={customDose}
                  onChangeText={setCustomDose}
                />
                <View style={styles.suffix}><Text style={styles.suffixText}>g/L</Text></View>
              </View>
            )}

            {/* Preço */}
            <Text style={[styles.label, { marginTop: 20 }]}>Preço do Produto</Text>
            <View style={styles.toggleRow}>
              {(["kg", "g"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.toggleBtn, precoUnit === u && styles.toggleBtnActive]}
                  onPress={() => setPrecoUnit(u)}
                >
                  <Text style={[styles.toggleText, precoUnit === u && styles.toggleTextActive]}>
                    R$/{u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputRow}>
              <View style={styles.prefix}><Text style={styles.prefixText}>R$</Text></View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="0,00"
                placeholderTextColor="#7a3a1a"
                keyboardType="decimal-pad"
                value={preco}
                onChangeText={setPreco}
              />
            </View>

            {/* Litros */}
            <Text style={[styles.label, { marginTop: 20 }]}>Tamanho do Tanque</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Litros"
                placeholderTextColor="#7a3a1a"
                keyboardType="decimal-pad"
                value={litros}
                onChangeText={setLitros}
              />
              <View style={styles.suffix}><Text style={styles.suffixText}>L</Text></View>
            </View>

            {/* Botão calcular */}
            <TouchableOpacity style={styles.btnCalc} onPress={calcular} activeOpacity={0.8}>
              <Text style={styles.btnCalcText}>CALCULAR</Text>
            </TouchableOpacity>

            {/* Resultado */}
            {resultado && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Resultado</Text>
                <View style={styles.resultDivider} />
                <ResultRow label="Dose" value={`${resultado.dose}g/L  ×  ${fmtNum(resultado.litros)}L`} />
                <ResultRow label="Quantidade" value={`${fmtNum(resultado.qtdG)}g  (${fmtKg(resultado.qtdKg)}kg)`} />
                <ResultRow label="Preço/g" value={`R$ ${resultado.precoG.toFixed(6)}`} />
                <View style={styles.resultDivider} />
                <Text style={styles.totalText}>💰  Total:  R$ {fmtNum(resultado.total)}</Text>
              </View>
            )}

            {/* Botão PDF */}
            <TouchableOpacity style={styles.btnPdf} onPress={exportarPdf} activeOpacity={0.8}>
              <Text style={styles.btnPdfText}>📄  EXPORTAR PDF</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg:           { flex: 1 },
  scroll:       { padding: 20, paddingTop: 52, paddingBottom: 40 },
  header:       { alignItems: "center", marginBottom: 24 },
  logo:         { width: 180, height: 70, marginBottom: 4 },
  subtitle:     { color: "#ffaa44", fontSize: 13, letterSpacing: 2 },

  card:         { backgroundColor: "#2d0f00cc", borderRadius: 20, padding: 24,
                  borderWidth: 1, borderColor: "#8b2500" },

  label:        { color: "#ffcfa0", fontSize: 13, marginBottom: 8 },

  doseRow:      { flexDirection: "row", gap: 8, marginBottom: 12 },
  doseBtn:      { flex: 1, backgroundColor: "#1f0800", borderRadius: 10, padding: 10,
                  alignItems: "center", borderWidth: 1, borderColor: "#5a1a00" },
  doseBtnActive:{ backgroundColor: "#ff6a00", borderColor: "#ff6a00" },
  doseBtnText:  { color: "#ffcfa0", fontSize: 12, fontWeight: "600" },
  doseBtnTextActive: { color: "#1a0000" },
  doseBtnSub:   { color: "#7a3a1a", fontSize: 10, marginTop: 2 },
  doseBtnSubActive:  { color: "#1a0000aa" },

  inputRow:     { flexDirection: "row", alignItems: "center", backgroundColor: "#1f0800",
                  borderRadius: 10, borderWidth: 1, borderColor: "#ff6a00",
                  overflow: "hidden", marginBottom: 4 },
  input:        { color: "#fff", fontSize: 16, paddingVertical: 14, paddingHorizontal: 12 },
  prefix:       { backgroundColor: "#1f0800", paddingHorizontal: 14, justifyContent: "center" },
  prefixText:   { color: "#ffaa44", fontWeight: "bold", fontSize: 15 },
  suffix:       { backgroundColor: "#2d0f00", paddingHorizontal: 14, justifyContent: "center" },
  suffixText:   { color: "#ffcfa0", fontSize: 13 },

  toggleRow:    { flexDirection: "row", marginBottom: 10, gap: 8 },
  toggleBtn:    { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                  backgroundColor: "#1f0800", borderWidth: 1, borderColor: "#5a1a00" },
  toggleBtnActive: { backgroundColor: "#7a1a00", borderColor: "#ff6a00" },
  toggleText:   { color: "#ffcfa0", fontWeight: "600", fontSize: 13 },
  toggleTextActive: { color: "#ffaa44" },

  btnCalc:      { backgroundColor: "#ff6a00", borderRadius: 12, paddingVertical: 16,
                  alignItems: "center", marginTop: 24, marginBottom: 8 },
  btnCalcText:  { color: "#1a0000", fontWeight: "bold", fontSize: 16, letterSpacing: 1 },

  resultBox:    { backgroundColor: "#1f0a00", borderRadius: 14, padding: 18,
                  borderWidth: 1, borderColor: "#8b2500", marginTop: 16 },
  resultTitle:  { color: "#ffaa44", fontWeight: "bold", fontSize: 14,
                  textAlign: "center", marginBottom: 10 },
  resultDivider:{ height: 1, backgroundColor: "#5a1a00", marginVertical: 8 },
  resultRow:    { flexDirection: "row", justifyContent: "space-between",
                  paddingVertical: 4 },
  resultLabel:  { color: "#ffcfa0", fontSize: 13 },
  resultValue:  { color: "#fff", fontSize: 13, fontWeight: "500" },
  totalText:    { color: "#fff", fontSize: 18, fontWeight: "bold",
                  textAlign: "center", marginTop: 6 },

  btnPdf:       { backgroundColor: "#3a0f00", borderRadius: 12, paddingVertical: 14,
                  alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#8b2500" },
  btnPdfText:   { color: "#ffaa44", fontWeight: "bold", fontSize: 14 },
});
