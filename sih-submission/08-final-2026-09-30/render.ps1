param([string]$In, [string]$Img, [string]$Pdf, [string]$Links)
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($In, $true, $false, $false)
New-Item -ItemType Directory -Force $Img | Out-Null
$out = @("W|{0}|{1}" -f $pres.PageSetup.SlideWidth, $pres.PageSetup.SlideHeight)
foreach ($s in $pres.Slides) {
  $s.Export("$Img\s$($s.SlideIndex).png", "PNG", 1920, 1080)
  foreach ($sh in $s.Shapes) {
    try { $a = $sh.ActionSettings(1).Hyperlink.Address; if ($a) { $out += "L|$($s.SlideIndex)|$($sh.Left)|$($sh.Top)|$($sh.Width)|$($sh.Height)|$a" } } catch {}
    if ($sh.HasTextFrame -and $sh.TextFrame.HasText) {
      $tr = $sh.TextFrame.TextRange
      if ($tr.BoundHeight -gt $sh.Height + 1 -or $tr.BoundWidth -gt $sh.Width + 1) { Write-Output ("OVERFLOW s{0} h{1:N0}/{2:N0} | {3}" -f $s.SlideIndex, $tr.BoundHeight, $sh.Height, $tr.Text.Substring(0,[math]::Min(40,$tr.Text.Length))) }
      for ($i = 1; $i -le $tr.Runs().Count; $i++) { $r = $tr.Runs($i); $a = $r.ActionSettings(1).Hyperlink.Address
        if ($a) { $out += "L|$($s.SlideIndex)|$($r.BoundLeft)|$($r.BoundTop)|$($r.BoundWidth)|$($r.BoundHeight)|$a" } }
    }
  }
}
$out | Set-Content -Encoding UTF8 $Links
$pres.SaveAs($Pdf, 32)
$pres.Close(); $pp.Quit()
Write-Output "links: $($out.Count - 1)"
