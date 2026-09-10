package com.aichatroom.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

/**
 * Thin native shell around the AI Chat Room web UI.
 *
 * The Node server does the real work (agents, providers, streaming); this app just
 * points a WebView at it. The server address is stored in SharedPreferences and can
 * be changed by tapping the address strip at the top or from the error screen.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "settings";
    private static final String KEY_SERVER_URL = "serverUrl";

    private WebView webView;
    private View errorView;
    private TextView errorMessage;
    private TextView addressText;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        webView = findViewById(R.id.webview);
        errorView = findViewById(R.id.error_view);
        errorMessage = findViewById(R.id.error_message);
        addressText = findViewById(R.id.address_text);

        findViewById(R.id.address_bar).setOnClickListener(v -> promptForServer(false));
        findViewById(R.id.error_change_server).setOnClickListener(v -> promptForServer(false));
        Button retry = findViewById(R.id.error_retry);
        retry.setOnClickListener(v -> loadServer());

        configureWebView();

        if (getServerUrl() == null) {
            promptForServer(true);
        } else if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
            addressText.setText(displayUrl(getServerUrl()));
        } else {
            loadServer();
        }
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        webView.setBackgroundColor(getColor(R.color.background));

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                Uri server = Uri.parse(getServerUrl());
                boolean sameServer = target.getHost() != null
                        && target.getHost().equalsIgnoreCase(server.getHost())
                        && target.getPort() == server.getPort();
                if (sameServer) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, target));
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                showError(null);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError(getString(R.string.error_unreachable, getServerUrl(), error.getDescription()));
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // Without this the whole app is killed when Chromium's renderer dies
                // (low memory, or a renderer bug). Swap in a fresh WebView instead.
                if (view == webView) {
                    replaceWebView();
                    showError(getString(R.string.error_renderer_gone, getServerUrl()));
                }
                return true;
            }
        });

        // Transcript exports (Content-Disposition: attachment) are handed to the system browser.
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) ->
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
    }

    private void replaceWebView() {
        ViewGroup parent = (ViewGroup) webView.getParent();
        int index = parent.indexOfChild(webView);
        ViewGroup.LayoutParams lp = webView.getLayoutParams();
        parent.removeView(webView);
        webView.destroy();

        webView = new WebView(this);
        webView.setId(R.id.webview);
        parent.addView(webView, index, lp);
        configureWebView();
    }

    private String getServerUrl() {
        return prefs.getString(KEY_SERVER_URL, null);
    }

    private void setServerUrl(String url) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply();
    }

    private void loadServer() {
        String url = getServerUrl();
        if (url == null) {
            promptForServer(true);
            return;
        }
        addressText.setText(displayUrl(url));
        showError(null);
        webView.loadUrl(url);
    }

    private void showError(String message) {
        boolean hasError = message != null;
        errorView.setVisibility(hasError ? View.VISIBLE : View.GONE);
        webView.setVisibility(hasError ? View.INVISIBLE : View.VISIBLE);
        if (hasError) {
            errorMessage.setText(message);
        }
    }

    private void promptForServer(boolean firstRun) {
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        input.setImeOptions(EditorInfo.IME_ACTION_DONE);
        input.setSingleLine(true);
        input.setText(getServerUrl() != null ? getServerUrl() : BuildConfig.DEFAULT_SERVER_URL);
        input.setSelectAllOnFocus(true);
        int pad = (int) (20 * getResources().getDisplayMetrics().density);
        input.setPadding(pad, pad, pad, pad / 2);

        AlertDialog.Builder builder = new AlertDialog.Builder(this)
                .setTitle(R.string.server_dialog_title)
                .setMessage(R.string.server_dialog_message)
                .setView(input)
                .setPositiveButton(R.string.connect, (d, w) -> {
                    String url = normalize(input.getText().toString());
                    if (url != null) {
                        setServerUrl(url);
                        loadServer();
                    } else {
                        promptForServer(firstRun);
                    }
                });
        if (!firstRun) {
            builder.setNegativeButton(android.R.string.cancel, null);
        } else {
            builder.setCancelable(false);
        }
        AlertDialog dialog = builder.create();
        input.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
                return true;
            }
            return false;
        });
        dialog.show();
    }

    /** Accepts "192.168.1.20:3000", "http://host:3000/", etc. Returns null when unusable. */
    private static String normalize(String raw) {
        String url = raw == null ? "" : raw.trim();
        if (url.isEmpty()) {
            return null;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        Uri parsed = Uri.parse(url);
        return parsed.getHost() == null || parsed.getHost().isEmpty() ? null : url;
    }

    private static String displayUrl(String url) {
        return url == null ? "" : url.replaceFirst("^https?://", "");
    }

    @Override
    public void onBackPressed() {
        if (webView.getVisibility() == View.VISIBLE && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
